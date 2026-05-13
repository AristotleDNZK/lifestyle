import { task } from "@trigger.dev/sdk/v3";
import { ProxyAgent, fetch as undiciFetch, type Dispatcher } from "undici";
import { DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT } from "../../lib/ai-photo-optimization";
import { addCredits } from "../../lib/credits";
import { supabaseAdmin } from "../../lib/supabase";
import { uploadToImgBB } from "../../lib/imgbb";

type GenerateImagePayload = {
  jobId: string;
  prompt: string;
  modelId: string;
  userId: string;
  cost: number;
  aspectRatio?: string;
  imageBase64?: string;
  imageMimeType?: string;
};

const RETRYABLE_ERROR_MESSAGE = "API 拥挤，触发 Trigger.dev 自动重试";

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function redactProxy(proxyUrl: string) {
  try {
    const url = new URL(proxyUrl);
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//${url.hostname}${port}`;
  } catch {
    return "invalid-proxy-url";
  }
}

type UndiciFetchOptions = Parameters<typeof undiciFetch>[1];

function getProxiedFetch() {
  const proxy =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    "";

  if (!proxy) {
    return async (url: string, options?: UndiciFetchOptions) =>
      undiciFetch(url, options);
  }

  console.log("[Trigger][Gemini][Network]", {
    mode: "proxy",
    proxy: redactProxy(proxy),
  });

  const dispatcher = new ProxyAgent(proxy);

  return async (url: string, options?: UndiciFetchOptions) =>
    undiciFetch(url, {
      ...((options ?? {}) as Record<string, unknown>),
      dispatcher,
    } as any);
}

function getOverallTimeoutMs() {
  const raw = process.env.GEMINI_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120_000;
  }

  return Math.min(Math.max(parsed, 10_000), 240_000);
}

function extractGeminiImage(json: any): { imageBase64: string; mimeType: string } | null {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;

    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data && typeof inline.data === "string") {
        return {
          imageBase64: inline.data,
          mimeType: typeof inline.mimeType === "string" ? inline.mimeType : "image/png",
        };
      }
    }
  }

  return null;
}

function buildGeminiFatalMessage(json: any, rawText: string, status?: number) {
  const promptFeedback = json?.promptFeedback;
  const promptBlocked =
    safeString(promptFeedback?.blockReasonMessage) ||
    safeString(promptFeedback?.blockReason);

  const candidate = Array.isArray(json?.candidates) ? json.candidates[0] : null;
  const finishMessage = safeString(candidate?.finishMessage);
  const upstreamMessage =
    safeString(json?.error?.message) ||
    safeString(json?.message) ||
    promptBlocked ||
    finishMessage;

  if (upstreamMessage) {
    return upstreamMessage;
  }

  if (rawText) {
    return rawText.slice(0, 1000);
  }

  return status ? `Gemini request failed (${status})` : "Gemini image generation failed";
}

function buildTaskErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 2000);
  }

  return "Unknown image generation error";
}

function isRetryableError(error: unknown) {
  return error instanceof Error && error.message === RETRYABLE_ERROR_MESSAGE;
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

async function requestGeminiImage(payload: GenerateImagePayload) {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");
  getRequiredEnv("IMGBB_API_KEY");

  const prompt = payload.prompt.trim() || DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;
  const modelId = payload.modelId.trim() || "gemini-3.1-flash-image";
  const aspectRatio = safeString(payload.aspectRatio).trim();
  const inputImageBase64 = safeString(payload.imageBase64).trim();
  const inputImageMimeType = safeString(payload.imageMimeType).trim() || "image/jpeg";

  const parts: Array<Record<string, unknown>> = [
    {
      text: aspectRatio ? `${prompt}\n输出比例: ${aspectRatio}` : prompt,
    },
  ];

  if (inputImageBase64) {
    parts.push({
      inlineData: {
        mimeType: inputImageMimeType,
        data: inputImageBase64,
      },
    });
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
  };

  const requestUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const customFetch = getProxiedFetch();
  const controller = new AbortController();
  const attemptTimeoutMs = Math.min(Math.max(getOverallTimeoutMs(), 10_000), 180_000);

  const timeout = setTimeout(() => {
    controller.abort(new Error(`Gemini request timed out after ${attemptTimeoutMs}ms`));
  }, attemptTimeoutMs);

  let response: Response | null = null;
  let rawText = "";

  try {
    response = (await customFetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    })) as unknown as Response;

    rawText = await response.text();
  } catch {
    throw new Error(RETRYABLE_ERROR_MESSAGE);
  } finally {
    clearTimeout(timeout);
  }

  let json: any = null;
  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    json = null;
  }

  if (response.status === 503) {
    throw new Error(RETRYABLE_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(buildGeminiFatalMessage(json, rawText, response.status));
  }

  const extracted = extractGeminiImage(json);
  if (!extracted?.imageBase64) {
    throw new Error(buildGeminiFatalMessage(json, rawText));
  }

  return extracted;
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
