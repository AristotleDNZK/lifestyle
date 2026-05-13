import { getCatalogItem } from "@/lib/billing/catalog";
import {
  addCreditLedgerEntry,
  getBillingOrder,
  insertLegacyTransaction,
  markBillingOrderFulfilled,
  markBillingOrderPaid,
  markProfileReviewOrderPaid,
  upsertSubscription,
} from "@/lib/billing/store";
import { sendProfileReviewReportEmail } from "@/lib/profile-review/email";
import {
  getProfileReviewReport,
  getProfileReviewSession,
  updateProfileReviewSession,
} from "@/lib/profile-review/session";

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  data?: Record<string, any>;
};

function getCustomData(data: Record<string, any>) {
  return (data.custom_data || data.customData || {}) as Record<string, any>;
}

function getTransactionId(data: Record<string, any>) {
  return String(data.id || "");
}

function getSubscriptionId(data: Record<string, any>) {
  return typeof data.subscription_id === "string"
    ? data.subscription_id
    : data.subscription?.id || null;
}

function getFirstPriceId(data: Record<string, any>) {
  const item = Array.isArray(data.items) ? data.items[0] : null;
  return item?.price?.id || item?.price_id || item?.priceId || null;
}

function getTime(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

export async function fulfillPaddleTransactionCompleted(event: PaddleEvent) {
  if (event.event_type !== "transaction.completed") {
    return { fulfilled: false, ignored: true };
  }

  const data = event.data || {};
  const customData = getCustomData(data);
  const orderId = String(customData.order_id || "");

  if (!orderId) {
    throw new Error("Paddle transaction.completed missing custom_data.order_id");
  }

  const order = await getBillingOrder(orderId);
  if (!order) {
    throw new Error(`Billing order not found: ${orderId}`);
  }

  if (order.status === "fulfilled") {
    return { fulfilled: true, duplicate: true };
  }

  const catalogItem = getCatalogItem(order.sku);
  const expectedPriceId = process.env[catalogItem.paddlePriceEnv];
  const actualPriceId = getFirstPriceId(data);

  if (expectedPriceId && actualPriceId && expectedPriceId !== actualPriceId) {
    throw new Error(
      `Paddle price mismatch for order ${order.id}: expected ${expectedPriceId}, received ${actualPriceId}`
    );
  }

  const transactionId = getTransactionId(data);
  if (!transactionId) {
    throw new Error("Paddle transaction.completed missing transaction id");
  }

  const subscriptionId = getSubscriptionId(data);
  const paidOrder = await markBillingOrderPaid({
    orderId: order.id,
    providerTransactionId: transactionId,
    providerSubscriptionId: subscriptionId,
  });

  if (catalogItem.productType === "credits") {
    const credits = catalogItem.credits || 0;
    await addCreditLedgerEntry({
      userId: paidOrder.user_id,
      orderId: paidOrder.id,
      amount: credits,
      reason: "paddle_credit_purchase",
      providerTransactionId: transactionId,
      metadata: { sku: catalogItem.sku },
    });
    await insertLegacyTransaction({
      userId: paidOrder.user_id,
      amount: catalogItem.amount,
      creditsAdded: credits,
      providerTransactionId: transactionId,
    });
  }

  if (catalogItem.productType === "subscription") {
    const monthlyCredits = catalogItem.monthlyCredits || 0;
    if (subscriptionId) {
      await upsertSubscription({
        userId: paidOrder.user_id,
        providerSubscriptionId: subscriptionId,
        sku: catalogItem.sku,
        status: "active",
        monthlyCredits,
        currentPeriodStartsAt: getTime(data.billing_period?.starts_at),
        currentPeriodEndsAt: getTime(data.billing_period?.ends_at),
        metadata: { transaction_id: transactionId },
      });
    }

    await addCreditLedgerEntry({
      userId: paidOrder.user_id,
      orderId: paidOrder.id,
      amount: monthlyCredits,
      reason: "paddle_subscription_period",
      providerTransactionId: transactionId,
      metadata: { sku: catalogItem.sku, subscription_id: subscriptionId },
    });
    await insertLegacyTransaction({
      userId: paidOrder.user_id,
      amount: catalogItem.amount,
      creditsAdded: monthlyCredits,
      providerTransactionId: transactionId,
    });
  }

  if (catalogItem.productType === "profile_review_unlock") {
    const sessionId =
      paidOrder.profile_review_session_id ||
      String(customData.profile_review_session_id || "");

    if (!sessionId) {
      throw new Error(`Profile review order ${paidOrder.id} missing session id`);
    }

    await markProfileReviewOrderPaid({
      sessionId,
      userId: paidOrder.user_id,
      amount: catalogItem.amount,
      providerOrderId: transactionId,
    });

    const [session, report] = await Promise.all([
      getProfileReviewSession(sessionId),
      getProfileReviewReport(sessionId),
    ]);

    if (report && paidOrder.email) {
      const reportUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dating-profile-review/report/${sessionId}`;

      await sendProfileReviewReportEmail({
        to: paidOrder.email,
        report: report.full_report,
        reportUrl,
      });

      await updateProfileReviewSession(sessionId, {
        user_id: paidOrder.user_id,
        email: paidOrder.email || session.email,
        status: "delivered",
        delivered_at: new Date().toISOString(),
      });
    }
  }

  await markBillingOrderFulfilled(paidOrder.id);

  return { fulfilled: true, orderId: paidOrder.id };
}
