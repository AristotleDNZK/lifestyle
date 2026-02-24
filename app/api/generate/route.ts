import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generateImage,
  downloadImage,
  type AspectRatio,
} from "@/lib/volcengine";
import { uploadImage } from "@/lib/r2";

/**
 * AI Generation API Route
 * Handles both image and video generation requests
 *
 * Flow:
 * 1. Authenticate user
 * 2. Deduct credits (using RPC for atomic operation)
 * 3. Branch based on type:
 *    - Image: Generate → Download → Upload to R2 → Save to DB
 *    - Video: Return "coming soon" message (no deduction, no generation)
 * 4. Error handling: Refund credits if generation fails
 */

// Credit costs
const CREDIT_COST = {
  image: 1,
  video: 10, // Reserved for future use
};

export async function POST(req: NextRequest) {
  let creditsDeducted = false;
  let userId: string | null = null;
  let generationType: "image" | "video" = "image";

  try {
    // Step 1: Authenticate user
    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { type, prompt, aspectRatio, seed, scale } = body;

    // Validate type
    if (!type || !["image", "video"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    generationType = type;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log(`Generation request - User: ${userId}, Type: ${type}, Prompt: "${prompt}"`);

    // =====================================================
    // VIDEO GENERATION (STUB - Coming Soon)
    // =====================================================
    if (type === "video") {
      console.log("Video generation requested - returning coming soon message");
      return NextResponse.json({
        status: "coming_soon",
        message: "Seedance 2.0 is currently in closed beta. Video generation will be available soon!",
        type: "video",
      });
      // Note: No credit deduction for video (feature not live yet)
    }

    // =====================================================
    // IMAGE GENERATION (ACTIVE)
    // =====================================================

    // Step A: Deduct credits using RPC (atomic operation)
    const costInCredits = CREDIT_COST.image;

    console.log(`Attempting to deduct ${costInCredits} credits from user ${userId}`);

    const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc(
      "deduct_credits",
      {
        p_user_id: userId,
        p_amount: costInCredits,
      }
    );

    if (deductError) {
      console.error("Credit deduction error:", deductError);
      return NextResponse.json(
        { error: "Failed to deduct credits. Please try again." },
        { status: 500 }
      );
    }

    if (!deductSuccess) {
      console.log("Insufficient credits");
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: costInCredits,
          message: "Please purchase more credits to continue generating images.",
        },
        { status: 402 } // Payment Required
      );
    }

    creditsDeducted = true;
    console.log(`Successfully deducted ${costInCredits} credits`);

    // Step B: Generate image using Volcengine
    console.log("Calling Volcengine API to generate image...");

    const volcengineResult = await generateImage({
      prompt: prompt.trim(),
      aspectRatio: (aspectRatio as AspectRatio) || "1:1",
      seed: seed,
      scale: scale,
    });

    if (!volcengineResult.success || !volcengineResult.imageUrl) {
      throw new Error(
        volcengineResult.error || "Failed to generate image from Volcengine"
      );
    }

    console.log("Image generated successfully:", volcengineResult.imageUrl);

    // Step C: Download image from Volcengine temporary URL
    console.log("Downloading image from Volcengine...");
    const imageBuffer = await downloadImage(volcengineResult.imageUrl);
    console.log(`Image downloaded: ${imageBuffer.length} bytes`);

    // Step D: Upload to Cloudflare R2
    console.log("Uploading image to Cloudflare R2...");
    const r2Url = await uploadImage(imageBuffer, "png");
    console.log("Image uploaded to R2:", r2Url);

    // Step E: Save generation record to database
    console.log("Saving generation record to database...");

    const { error: insertError } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        type: "image",
        prompt: prompt.trim(),
        url: r2Url,
        cost: costInCredits,
        status: "completed",
      });

    if (insertError) {
      console.error("Failed to save generation record:", insertError);
      // Note: We don't throw here because the image was successfully generated
      // The user got their image, so we don't refund credits
    }

    // Step F: Return success response
    console.log("Generation completed successfully");

    return NextResponse.json({
      success: true,
      type: "image",
      url: r2Url,
      prompt: prompt.trim(),
      creditsUsed: costInCredits,
      requestId: volcengineResult.requestId,
    });
  } catch (error: any) {
    console.error("Generation error:", error);

    // =====================================================
    // ERROR HANDLING: Refund credits if deducted
    // =====================================================
    if (creditsDeducted && userId) {
      console.log(`Refunding ${CREDIT_COST[generationType]} credits to user ${userId}`);

      try {
        const { error: refundError } = await supabaseAdmin.rpc(
          "add_credits",
          {
            p_user_id: userId,
            p_amount: CREDIT_COST[generationType],
          }
        );

        if (refundError) {
          console.error("Failed to refund credits:", refundError);
          // Log this for manual intervention
          console.error(`CRITICAL: User ${userId} needs manual credit refund of ${CREDIT_COST[generationType]} credits`);
        } else {
          console.log("Credits refunded successfully");
        }
      } catch (refundError) {
        console.error("Refund exception:", refundError);
      }
    }

    // Return error response
    return NextResponse.json(
      {
        error: error.message || "An error occurred during generation",
        type: generationType,
        creditsRefunded: creditsDeducted,
      },
      { status: 500 }
    );
  }
}
