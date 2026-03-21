import { task } from "@trigger.dev/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generateProfileReviewReport,
  loadImageForGemini,
} from "@/lib/profile-review/gemini";
import {
  loadProfileReviewContext,
  updateProfileReviewSession,
  upsertProfileReviewReport,
} from "@/lib/profile-review/session";

type GenerateProfileReviewPayload = {
  sessionId: string;
};

async function updateImageStatuses(
  sessionId: string,
  values: Record<string, unknown>
) {
  const { error } = await supabaseAdmin
    .from("profile_review_images")
    .update(values)
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to update profile review images: ${error.message}`);
  }
}

export const generateProfileReviewTask = task({
  id: "generate-profile-review",
  retry: {
    maxAttempts: 2,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: false,
  },
  run: async (payload: GenerateProfileReviewPayload) => {
    await updateProfileReviewSession(payload.sessionId, {
      status: "awaiting_analysis",
      failure_reason: null,
    });
    await updateImageStatuses(payload.sessionId, {
      analysis_status: "processing",
      analysis_score: null,
    });

    try {
      const context = await loadProfileReviewContext(payload.sessionId);
      if (!context.images.length) {
        throw new Error("No images uploaded for profile review");
      }

      const modelImages = [];
      for (const image of context.images) {
        modelImages.push(await loadImageForGemini(image));
      }

      const generated = await generateProfileReviewReport({
        answers: context.answers,
        images: modelImages,
      });

      await upsertProfileReviewReport({
        sessionId: payload.sessionId,
        modelName: generated.modelName,
        modelVersion: generated.modelVersion,
        promptVersion: generated.promptVersion,
        previewReport: generated.previewReport,
        fullReport: generated.fullReport,
        rawModelOutput: generated.rawModelOutput,
      });

      for (const photo of generated.fullReport.photoReviews) {
        const { error } = await supabaseAdmin
          .from("profile_review_images")
          .update({
            analysis_status: "completed",
            analysis_score: photo.imageScore,
          })
          .eq("id", photo.imageId);

        if (error) {
          throw new Error(
            `Failed to persist image analysis score: ${error.message}`
          );
        }
      }

      await updateProfileReviewSession(payload.sessionId, {
        status: "analyzed",
        preview_score: generated.previewReport.overallScore,
        final_score: generated.fullReport.overallScore,
        preview_ready_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        current_step: 21,
      });

      return {
        sessionId: payload.sessionId,
        overallScore: generated.fullReport.overallScore,
      };
    } catch (error) {
      await updateImageStatuses(payload.sessionId, {
        analysis_status: "failed",
      });
      await updateProfileReviewSession(payload.sessionId, {
        status: "failed",
        failure_reason:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "Unknown profile review error",
      });
      throw error;
    }
  },
});
