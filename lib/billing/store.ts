import { supabaseAdmin } from "@/lib/supabase";
import type { BillingCatalogItem, BillingSku } from "@/lib/billing/catalog";

export interface BillingOrder {
  id: string;
  user_id: string;
  email: string | null;
  provider: string;
  product_type: string;
  sku: BillingSku;
  amount: number;
  currency: string;
  credits: number | null;
  monthly_credits: number | null;
  status: string;
  provider_transaction_id: string | null;
  provider_subscription_id: string | null;
  profile_review_session_id: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createBillingOrder(params: {
  userId: string;
  email?: string | null;
  item: BillingCatalogItem;
  profileReviewSessionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from("billing_orders")
    .insert({
      user_id: params.userId,
      email: params.email || null,
      provider: "paddle",
      product_type: params.item.productType,
      sku: params.item.sku,
      amount: params.item.amount,
      currency: params.item.currency,
      credits: params.item.credits || null,
      monthly_credits: params.item.monthlyCredits || null,
      status: "created",
      profile_review_session_id: params.profileReviewSessionId || null,
      metadata: params.metadata || {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create billing order");
  }

  return data as BillingOrder;
}

export async function recordBillingEvent(params: {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  orderId?: string | null;
  providerTransactionId?: string | null;
  providerSubscriptionId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("billing_events")
    .insert({
      provider: "paddle",
      event_id: params.eventId,
      event_type: params.eventType,
      payload: params.payload,
      order_id: params.orderId || null,
      provider_transaction_id: params.providerTransactionId || null,
      provider_subscription_id: params.providerSubscriptionId || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { duplicate: true, event: null };
    }

    throw new Error(error.message);
  }

  return { duplicate: false, event: data };
}

export async function markBillingEventProcessed(eventId: string) {
  const { error } = await supabaseAdmin
    .from("billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "paddle")
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getBillingOrder(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data || null) as BillingOrder | null;
}

export async function markBillingOrderPaid(params: {
  orderId: string;
  providerTransactionId: string;
  providerSubscriptionId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("billing_orders")
    .update({
      status: "paid",
      provider_transaction_id: params.providerTransactionId,
      provider_subscription_id: params.providerSubscriptionId || null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.orderId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to mark billing order paid");
  }

  return data as BillingOrder;
}

export async function markBillingOrderFulfilled(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_orders")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to mark billing order fulfilled");
  }

  return data as BillingOrder;
}

export async function addCreditLedgerEntry(params: {
  userId: string;
  orderId: string;
  amount: number;
  reason: string;
  providerTransactionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error: ledgerError } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: params.userId,
    order_id: params.orderId,
    amount: params.amount,
    reason: params.reason,
    provider: "paddle",
    provider_transaction_id: params.providerTransactionId || null,
    metadata: params.metadata || {},
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  const { data, error } = await supabaseAdmin.rpc("add_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data);
}

export async function insertLegacyTransaction(params: {
  userId: string;
  amount: number;
  creditsAdded: number;
  providerTransactionId: string;
}) {
  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: params.userId,
    amount: params.amount,
    credits_added: params.creditsAdded,
    stripe_payment_id: params.providerTransactionId,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export async function upsertSubscription(params: {
  userId: string;
  providerSubscriptionId: string;
  sku: string;
  status: string;
  monthlyCredits: number;
  currentPeriodStartsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  canceledAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: params.userId,
        provider: "paddle",
        provider_subscription_id: params.providerSubscriptionId,
        sku: params.sku,
        status: params.status,
        monthly_credits: params.monthlyCredits,
        current_period_starts_at: params.currentPeriodStartsAt || null,
        current_period_ends_at: params.currentPeriodEndsAt || null,
        canceled_at: params.canceledAt || null,
        metadata: params.metadata || {},
      },
      { onConflict: "provider,provider_subscription_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to upsert subscription");
  }

  return data;
}

export async function markProfileReviewOrderPaid(params: {
  sessionId: string;
  userId: string;
  amount: number;
  providerOrderId: string;
}) {
  const paidAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("profile_review_orders")
    .upsert(
      {
        session_id: params.sessionId,
        user_id: params.userId,
        amount: params.amount,
        currency: "usd",
        status: "paid",
        provider: "paddle",
        provider_order_id: params.providerOrderId,
        paid_at: paidAt,
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to mark profile review order paid");
  }

  const { error: sessionError } = await supabaseAdmin
    .from("profile_review_sessions")
    .update({
      user_id: params.userId,
      status: "paid",
      paid_at: paidAt,
    })
    .eq("id", params.sessionId);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return data;
}
