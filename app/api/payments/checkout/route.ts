import { NextRequest, NextResponse } from "next/server";
import {
  type BillingSku,
  getCatalogItem,
  getPaddlePriceId,
  isSubscriptionSku,
} from "@/lib/billing/catalog";
import { createBillingOrder } from "@/lib/billing/store";
import { ensureUserExists } from "@/lib/credits";
import { getAppAuthSession } from "@/lib/local-dev-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await getAppAuthSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const body = (await req.json()) as { sku?: string };
    const sku = body.sku;

    if (!sku) {
      return NextResponse.json({ error: "Missing SKU" }, { status: 400 });
    }

    const item = getCatalogItem(sku);

    if (item.productType === "profile_review_unlock") {
      return NextResponse.json(
        { error: "Use the profile review checkout endpoint for this SKU" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email address found for this account" },
        { status: 400 }
      );
    }

    await ensureUserExists(userId, email);

    const order = await createBillingOrder({
      userId,
      email,
      item,
      metadata: {
        checkout_source: "generic",
      },
    });

    const customData = {
      order_id: order.id,
      user_id: userId,
      sku: item.sku,
      product_type: item.productType,
      credits: item.credits ? String(item.credits) : undefined,
      monthly_credits: item.monthlyCredits ? String(item.monthlyCredits) : undefined,
    };

    return NextResponse.json({
      orderId: order.id,
      email,
      provider: "paddle",
      sku: item.sku,
      productType: item.productType,
      checkoutMode: isSubscriptionSku(item.sku) ? "subscription" : "payment",
      paddlePriceId: getPaddlePriceId(item.sku as BillingSku),
      customData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Unknown billing SKU") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
