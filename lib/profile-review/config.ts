import { env } from "@/lib/env";

function parseInteger(raw: string, fallback: number) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function parseDecimal(raw: string, fallback: number) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const profileReviewConfig = {
  observationModel: env.PROFILE_REVIEW_OBSERVATION_MODEL,
  reportModel: env.PROFILE_REVIEW_REPORT_MODEL,
  timeoutMs: parseInteger(env.GEMINI_TIMEOUT_MS || "120000", 120_000),
  storageBucket: env.PROFILE_REVIEW_STORAGE_BUCKET,
  maxUploadImages: parseInteger(env.PROFILE_REVIEW_MAX_UPLOAD_IMAGES, 9),
  scoreMax: parseInteger(env.PROFILE_REVIEW_SCORE_MAX, 50),
  unlockPriceUsd: parseDecimal(env.PROFILE_REVIEW_UNLOCK_PRICE_USD, 3.99),
  resendApiKey: env.RESEND_API_KEY || "",
  reportFromEmail: env.PROFILE_REVIEW_REPORT_FROM_EMAIL || "",
  reportReplyTo: env.PROFILE_REVIEW_REPORT_REPLY_TO || "",
};

export const profileReviewPromptVersion = "2026-03-15-v1";

export function requireGeminiApiKey() {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return env.GEMINI_API_KEY;
}

export function requireResendApiKey() {
  if (!profileReviewConfig.resendApiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return profileReviewConfig.resendApiKey;
}
