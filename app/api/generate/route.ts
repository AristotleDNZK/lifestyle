import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { addCredits, deductCredits } from "@/lib/credits";
import {
  resolveGenerationCost,
  resolveModelId,
  safeString,
} from "@/lib/generation-jobs";
import { DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT } from "@/lib/ai-photo-optimization";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import {
  createLocalGenerationJob,
  isLocalDevGenerationStoreEnabled,
} from "@/lib/local-dev-generations";
import { supabaseAdmin } from "@/lib/supabase";
import { findUserIdentityRecords } from "@/lib/user-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

type GenerateRequestBody = {
  type?: string;
  prompt?: string;
  model?: string;
  modelId?: string;
  ratio?: string;
  aspectRatio?: string;
  imageBase64?: string;
  imageMimeType?: string;
  images?: Array<{
    imageBase64?: string;
    imageMimeType?: string;
  }>;
};

function buildErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 2000);
  }

  return "Unknown error";
}

async function refundCreditsSafely(userId: string, amount: number, email?: string) {
  if (amount <= 0) return;

  try {
    await addCredits(userId, amount, email);
  } catch (error) {
    console.error("[GenerateRoute][RefundCreditsError]", {
      userId,
      amount,
      error,
    });
  }
}

async function markJobFailed(jobId: string, message: string) {
  const { error } = await supabaseAdmin
    .from("generations")
    .update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error("[GenerateRoute][MarkFailedError]", {
      jobId,
      error,
    });
  }
}

function normalizeRequestImages(body: GenerateRequestBody) {
  const requestImages = Array.isArray(body.images)
    ? body.images
        .map((image) => ({
          imageBase64: safeString(image?.imageBase64).trim(),
          imageMimeType:
            safeString(image?.imageMimeType).trim() || "image/jpeg",
        }))
        .filter((image) => image.imageBase64.length > 0)
        .slice(0, 5)
    : [];

  if (requestImages.length > 0) {
    return requestImages;
  }

  const imageBase64 = safeString(body.imageBase64).trim();
  if (!imageBase64) {
    return [];
  }

  return [
    {
      imageBase64,
      imageMimeType: safeString(body.imageMimeType).trim() || "image/jpeg",
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await getAppAuthSession();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    let body: GenerateRequestBody;
    try {
      body = (await req.json()) as GenerateRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const type = safeString(body.type).trim() || "image";

    if (type === "video") {
      return NextResponse.json({
        status: "coming_soon",
        message: "Video generation is coming soon.",
      });
    }

    if (type !== "image") {
      return NextResponse.json(
        { error: "Unsupported generation type." },
        { status: 400 }
      );
    }

    const prompt =
      safeString(body.prompt).trim() || DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;
    const aspectRatio =
      safeString(body.ratio).trim() || safeString(body.aspectRatio).trim() || null;
    const requestImages = normalizeRequestImages(body);
    const primaryImage = requestImages[0];
    const imageBase64 = primaryImage?.imageBase64;
    const imageMimeType = primaryImage?.imageMimeType;
    const modelId = resolveModelId(body);
    const cost = resolveGenerationCost(body);

    if (isLocalDevGenerationStoreEnabled()) {
      const job = createLocalGenerationJob({
        userId,
        prompt,
        modelId,
        aspectRatio,
        cost,
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        local: true,
      });
    }

    const identity = await findUserIdentityRecords({ userId, email });
    const canonicalUserId = identity.canonicalUserId;

    const deductSuccess = await deductCredits(userId, cost, email);

    if (!deductSuccess) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: cost,
          message: "Please purchase more credits to continue generating images.",
        },
        { status: 402 }
      );
    }

    const { data: job, error: insertError } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: canonicalUserId,
        type: "image",
        prompt,
        status: "pending",
        url: null,
        image_url: null,
        error_message: null,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        cost,
        trigger_run_id: null,
      })
      .select("id")
      .single();

    if (insertError || !job?.id) {
      console.error("[GenerateRoute][InsertJobError]", insertError);
      await refundCreditsSafely(userId, cost, email);

      return NextResponse.json(
        { error: "Failed to create generation job." },
        { status: 500 }
      );
    }

    const jobId = String(job.id);

    try {
      const handle = await tasks.trigger("generate-image", {
        jobId,
        prompt,
        modelId,
        userId: canonicalUserId,
        cost,
        aspectRatio: aspectRatio ?? undefined,
        imageBase64,
        imageMimeType,
        images: requestImages,
      });

      const { error: triggerRunUpdateError } = await supabaseAdmin
        .from("generations")
        .update({
          trigger_run_id: handle.id,
        })
        .eq("id", jobId);

      if (triggerRunUpdateError) {
        console.error("[GenerateRoute][SaveRunIdError]", {
          jobId,
          error: triggerRunUpdateError,
        });
      }
    } catch (error) {
      const message = buildErrorMessage(error);

      console.error("[GenerateRoute][TriggerTaskError]", {
        jobId,
        message,
      });

      await markJobFailed(jobId, message);
      await refundCreditsSafely(userId, cost, email);

      return NextResponse.json(
        { error: "Failed to queue generation job." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
    });
  } catch (error) {
    console.error("[GenerateRoute][UnhandledError]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
