import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text (required for Stripe signature verification)
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found in headers");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET");
      }
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Processing checkout.session.completed:", session.id);

      // Extract metadata from the session
      const userId = session.metadata?.userId;
      const creditsToAdd = parseInt(session.metadata?.credits || "0");
      const packageType = session.metadata?.packageType;

      // Validate metadata
      if (!userId || !creditsToAdd) {
        console.error("Missing metadata in session:", session.id);
        return NextResponse.json(
          { error: "Missing userId or credits in metadata" },
          { status: 400 }
        );
      }

      // Get payment details
      const amountTotal = session.amount_total || 0; // in cents
      const paymentIntentId = session.payment_intent as string;

      console.log(`Adding ${creditsToAdd} credits to user ${userId}`);

      try {
        // Step 1: Check if this transaction already exists (idempotency)
        const { data: existingTransaction } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("stripe_payment_id", paymentIntentId)
          .single();

        if (existingTransaction) {
          console.log("Transaction already processed:", paymentIntentId);
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Step 2: Atomically add credits using RPC function
        const { data: newBalance, error: creditError } = await supabaseAdmin.rpc(
          "add_credits",
          {
            p_user_id: userId,
            p_amount: creditsToAdd,
          }
        );

        if (creditError) {
          // If user doesn't exist, create them first
          if (creditError.message.includes("User not found")) {
            console.log("Creating new user:", userId);

            // Get user email from Stripe session
            const userEmail = session.customer_details?.email || "unknown@example.com";

            // Create user with initial credits
            const { error: createError } = await supabaseAdmin
              .from("users")
              .insert({
                id: userId,
                email: userEmail,
                credits: creditsToAdd,
              });

            if (createError) {
              console.error("Failed to create user:", createError);
              throw new Error(`Failed to create user: ${createError.message}`);
            }

            console.log(`User created with ${creditsToAdd} credits`);
          } else {
            console.error("Failed to add credits:", creditError);
            throw new Error(`Failed to add credits: ${creditError.message}`);
          }
        } else {
          console.log(`Credits added successfully. New balance: ${newBalance}`);
        }

        // Step 3: Record transaction in database
        const { error: transactionError } = await supabaseAdmin
          .from("transactions")
          .insert({
            user_id: userId,
            amount: amountTotal,
            credits_added: creditsToAdd,
            stripe_payment_id: paymentIntentId,
          });

        if (transactionError) {
          console.error("Failed to record transaction:", transactionError);
          // This is critical - we added credits but couldn't record the transaction
          // In production, you might want to implement a retry mechanism or alert system
          throw new Error(`Failed to record transaction: ${transactionError.message}`);
        }

        console.log("Transaction recorded successfully:", paymentIntentId);

        return NextResponse.json({
          received: true,
          userId,
          creditsAdded: creditsToAdd,
        });

      } catch (dbError: any) {
        console.error("Database operation failed:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    // Handle other event types (optional)
    console.log("Received event type:", event.type);

    // Return success for all other events
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
