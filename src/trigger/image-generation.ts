import { task } from "@trigger.dev/sdk/v3";
import { addCredits } from "../../lib/credits";
import {
  GEMINI_NETWORK_ERROR_MESSAGE,
  GEMINI_RETRYABLE_ERROR_MESSAGE,
  requestGeminiImage,
  type GenerateImagePayload,
} from "../../lib/gemini-image-generation";
import { uploadToImgBB } from "../../lib/imgbb";
import { supabaseAdmin } from "../../lib/supabase";

function buildTaskErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 2000);
  }

  return "Unknown image generation error";
}

function isRetryableError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === GEMINI_RETRYABLE_ERROR_MESSAGE ||
      error.message === GEMINI_NETWORK_ERROR_MESSAGE)
  );
}

async function updateGeneration(
  jobId: string,
  values: Record<string, string | number | null>
) {
  const { error } = await supabaseAdmin
    .from("generations")
    .update(values)
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update generation ${jobId}: ${error.message}`);
  }
}

async function refundCreditsSafely(userId: string, amount: number) {
  if (amount <= 0) return;

  try {
    await addCredits(userId, amount);
  } catch (error) {
    console.error("[Trigger][GenerateImage][RefundCreditsError]", {
      userId,
      amount,
      error,
    });
  }
}

export const generateImageTask = task({
  id: "generate-image",
  run: async (payload: GenerateImagePayload, { ctx }) => {
    await updateGeneration(payload.jobId, {
      status: "processing",
      error_message: null,
      started_at: new Date().toISOString(),
      trigger_run_id: (ctx as { run?: { id?: string } }).run?.id ?? null,
    });

    try {
      const { imageBase64, mimeType } = await requestGeminiImage(payload);
      const uploadResult = await uploadToImgBB(imageBase64);

      await updateGeneration(payload.jobId, {
        status: "completed",
        image_url: uploadResult.url,
        url: uploadResult.url,
        error_message: null,
        completed_at: new Date().toISOString(),
      });

      return {
        jobId: payload.jobId,
        userId: payload.userId,
        modelId: payload.modelId,
        mimeType,
        imageUrl: uploadResult.url,
        status: "completed" as const,
      };
    } catch (error) {
      if (isRetryableError(error)) {
        throw error;
      }

      await updateGeneration(payload.jobId, {
        status: "failed",
        error_message: buildTaskErrorMessage(error),
        completed_at: new Date().toISOString(),
      });

      throw error;
    }
  },
  onFailure: async (params) => {
    const payload = params.payload as GenerateImagePayload;
    const runContext = params.ctx as { run?: { id?: string } };

    await refundCreditsSafely(payload.userId, payload.cost);

    await updateGeneration(payload.jobId, {
      status: "failed",
      error_message: buildTaskErrorMessage(params.error),
      completed_at: new Date().toISOString(),
      trigger_run_id: runContext.run?.id ?? null,
    });
  },
});
