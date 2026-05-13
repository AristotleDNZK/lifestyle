import { NextRequest, NextResponse } from "next/server";
import { fulfillPaddleTransactionCompleted } from "@/lib/billing/fulfillment";
import {
  markBillingEventProcessed,
  recordBillingEvent,
} from "@/lib/billing/store";
import { verifyPaddleSignature } from "@/lib/billing/paddle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";
  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";

  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid Paddle signature" }, { status: 400 });
  }

  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventId = String(event.event_id || event.id || "");
  const eventType = String(event.event_type || "");
  const data = event.data || {};
  const customData = data.custom_data || {};

  if (!eventId || !eventType) {
    return NextResponse.json({ error: "Missing Paddle event id or type" }, { status: 400 });
  }

  const recorded = await recordBillingEvent({
    eventId,
    eventType,
    payload: event,
    orderId: customData.order_id || null,
    providerTransactionId: data.id || null,
    providerSubscriptionId: data.subscription_id || data.subscription?.id || null,
  });

  if (recorded.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType === "transaction.completed") {
    await fulfillPaddleTransactionCompleted(event);
    await markBillingEventProcessed(eventId);
  }

  return NextResponse.json({ received: true });
}
