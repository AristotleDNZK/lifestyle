import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import {
  supabaseAdmin,
  type ProfileReviewAnswer,
  type ProfileReviewImage,
  type ProfileReviewOrder,
  type ProfileReviewReport,
  type ProfileReviewSession,
} from "@/lib/supabase";
import { profileReviewConfig } from "@/lib/profile-review/config";
import {
  createSignedProfileReviewUrl,
  removeProfileReviewFolder,
  uploadProfileReviewPhoto,
} from "@/lib/profile-review/storage";
import type {
  ProfileReviewFullReport,
  ProfileReviewPreviewReport,
} from "@/lib/profile-review/types";

export class ProfileReviewError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProfileReviewError";
    this.status = status;
  }
}

export function createProfileReviewAccessToken() {
  return `${randomUUID()}-${randomUUID()}`;
}

export function createMockOrderId(sessionId: string) {
  return `mock_${sessionId}`;
}

export async function createProfileReviewSession() {
  const accessToken = createProfileReviewAccessToken();

  const { data, error } = await supabaseAdmin
    .from("profile_review_sessions")
    .insert({
      access_token: accessToken,
      current_step: 1,
      status: "in_progress",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new ProfileReviewError(
      500,
      error?.message || "Failed to create profile review session"
    );
  }

  return data as ProfileReviewSession;
}

export async function getProfileReviewSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  if (!data) {
    throw new ProfileReviewError(404, "Profile review session not found");
  }

  return data as ProfileReviewSession;
}

export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}

export async function requireProfileReviewAccess(params: {
  sessionId: string;
  accessToken?: string | null;
  userId?: string | null;
}) {
  const session = await getProfileReviewSession(params.sessionId);

  if (params.userId && session.user_id === params.userId) {
    return session;
  }

  if (params.accessToken && session.access_token === params.accessToken) {
    return session;
  }

  throw new ProfileReviewError(
    403,
    "You do not have access to this profile review session"
  );
}

export async function updateProfileReviewSession(
  sessionId: string,
  values: Partial<ProfileReviewSession>
) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_sessions")
    .update(values)
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new ProfileReviewError(
      500,
      error?.message || "Failed to update profile review session"
    );
  }

  return data as ProfileReviewSession;
}

export async function saveProfileReviewAnswer(params: {
  sessionId: string;
  stepKey: string;
  question: string;
  answerValue: string;
  answerLabel: string;
  rawPayload?: Record<string, unknown>;
  currentStep?: number;
}) {
  const payload = params.rawPayload || {};

  const { data, error } = await supabaseAdmin
    .from("profile_review_answers")
    .upsert(
      {
        session_id: params.sessionId,
        step_key: params.stepKey,
        question: params.question,
        answer_value: params.answerValue,
        answer_label: params.answerLabel,
        raw_payload: payload,
        answered_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id,step_key",
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new ProfileReviewError(
      500,
      error?.message || "Failed to save answer"
    );
  }

  const session = await getProfileReviewSession(params.sessionId);
  const nextValues: Partial<ProfileReviewSession> = {};

  if (
    typeof params.currentStep === "number" &&
    params.currentStep > session.current_step
  ) {
    nextValues.current_step = params.currentStep;
  }

  if (params.stepKey === "report_email") {
    nextValues.email = params.answerValue;
  }

  if (Object.keys(nextValues).length > 0) {
    await updateProfileReviewSession(params.sessionId, nextValues);
  }

  return data as ProfileReviewAnswer;
}

export async function getProfileReviewAnswers(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  return (data || []) as ProfileReviewAnswer[];
}

export async function replaceProfileReviewImages(params: {
  sessionId: string;
  files: File[];
}) {
  if (!params.files.length) {
    throw new ProfileReviewError(400, "At least one image is required");
  }

  if (params.files.length > profileReviewConfig.maxUploadImages) {
    throw new ProfileReviewError(
      400,
      `You can upload at most ${profileReviewConfig.maxUploadImages} images`
    );
  }

  await removeProfileReviewFolder(params.sessionId);

  const { error: deleteError } = await supabaseAdmin
    .from("profile_review_images")
    .delete()
    .eq("session_id", params.sessionId);

  if (deleteError) {
    throw new ProfileReviewError(500, deleteError.message);
  }

  const rows: Array<Record<string, unknown>> = [];
  for (const [index, file] of params.files.entries()) {
    const upload = await uploadProfileReviewPhoto({
      sessionId: params.sessionId,
      file,
      sortOrder: index + 1,
    });

    rows.push({
      session_id: params.sessionId,
      storage_provider: "supabase",
      storage_path: upload.storagePath,
      mime_type: upload.mimeType,
      file_name: upload.fileName,
      sort_order: index + 1,
      analysis_status: "pending",
      analysis_score: null,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("profile_review_images")
    .insert(rows)
    .select("*");

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  await updateProfileReviewSession(params.sessionId, {
    status: "awaiting_analysis",
    current_step: 20,
  });

  return (data || []) as ProfileReviewImage[];
}

export async function getProfileReviewImages(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_images")
    .select("*")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  return (data || []) as ProfileReviewImage[];
}

export async function getProfileReviewImagesWithUrls(sessionId: string) {
  const images = await getProfileReviewImages(sessionId);

  return Promise.all(
    images.map(async (image) => ({
      ...image,
      signedUrl: await createSignedProfileReviewUrl(image.storage_path),
    }))
  );
}

export async function upsertProfileReviewReport(params: {
  sessionId: string;
  modelName: string;
  modelVersion?: string | null;
  promptVersion: string;
  previewReport: ProfileReviewPreviewReport;
  fullReport: ProfileReviewFullReport;
  rawModelOutput: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_reports")
    .upsert(
      {
        session_id: params.sessionId,
        model_name: params.modelName,
        model_version: params.modelVersion || null,
        prompt_version: params.promptVersion,
        preview_report: params.previewReport,
        full_report: params.fullReport,
        raw_model_output: params.rawModelOutput,
        generated_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id",
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new ProfileReviewError(
      500,
      error?.message || "Failed to save profile review report"
    );
  }

  return data as ProfileReviewReport;
}

export async function getProfileReviewReport(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_reports")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  return (data || null) as ProfileReviewReport | null;
}

export async function upsertProfileReviewOrder(params: {
  sessionId: string;
  userId: string;
  amount: number;
  status: ProfileReviewOrder["status"];
  providerOrderId?: string;
}) {
  const providerOrderId =
    params.providerOrderId || createMockOrderId(params.sessionId);

  const { data, error } = await supabaseAdmin
    .from("profile_review_orders")
    .upsert(
      {
        session_id: params.sessionId,
        user_id: params.userId,
        amount: params.amount,
        currency: "usd",
        status: params.status,
        provider: "mock",
        provider_order_id: providerOrderId,
        paid_at: params.status === "paid" ? new Date().toISOString() : null,
      },
      {
        onConflict: "session_id",
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new ProfileReviewError(
      500,
      error?.message || "Failed to save profile review order"
    );
  }

  return data as ProfileReviewOrder;
}

export async function getProfileReviewOrder(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_review_orders")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new ProfileReviewError(500, error.message);
  }

  return (data || null) as ProfileReviewOrder | null;
}

export async function attachProfileReviewSessionToUser(params: {
  sessionId: string;
  userId: string;
  accessToken?: string | null;
  email?: string | null;
}) {
  const session = await requireProfileReviewAccess({
    sessionId: params.sessionId,
    accessToken: params.accessToken,
    userId: params.userId,
  });

  if (session.user_id && session.user_id !== params.userId) {
    throw new ProfileReviewError(
      409,
      "This review session already belongs to another user"
    );
  }

  return updateProfileReviewSession(params.sessionId, {
    user_id: params.userId,
    email: params.email || session.email,
  });
}

export async function loadProfileReviewContext(sessionId: string) {
  const [session, answers, images, report, order] = await Promise.all([
    getProfileReviewSession(sessionId),
    getProfileReviewAnswers(sessionId),
    getProfileReviewImages(sessionId),
    getProfileReviewReport(sessionId),
    getProfileReviewOrder(sessionId),
  ]);

  return {
    session,
    answers,
    images,
    report,
    order,
  };
}
