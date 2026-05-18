import { ProxyAgent, fetch as undiciFetch } from "undici";
import { DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT } from "@/lib/ai-photo-optimization";

export type GeminiInputImage = {
  imageBase64?: string;
  imageMimeType?: string;
};

export type GenerateImagePayload = {
  jobId: string;
  prompt: string;
  modelId: string;
  userId: string;
  cost: number;
  aspectRatio?: string;
  imageBase64?: string;
  imageMimeType?: string;
  images?: GeminiInputImage[];
  geminiApiKey?: string;
};

export type GeminiImageResult = {
  imageBase64: string;
  mimeType: string;
};

export const GEMINI_RETRYABLE_ERROR_MESSAGE =
  "Gemini API is temporarily unavailable; Trigger.dev should retry";
export const GEMINI_NETWORK_ERROR_MESSAGE =
  "Gemini network request failed through all configured paths";

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
type GeminiFetchCandidate = {
  label: "proxy" | "auto-proxy" | "direct" | "relay-proxy" | "relay-direct";
  proxyUrl?: string;
  fetch: (url: string, options?: UndiciFetchOptions) => Promise<unknown>;
};

function getExplicitGeminiProxyUrl() {
  if (process.env.GEMINI_PROXY_URL) {
    return process.env.GEMINI_PROXY_URL;
  }

  if (process.env.GEMINI_USE_SYSTEM_PROXY !== "1") {
    return "";
  }

  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || "";
}

function getAutoLocalProxyUrls() {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  const raw = process.env.GEMINI_AUTO_PROXY_URLS || "";

  if (!raw && process.env.GEMINI_AUTO_PROXY !== "1") {
    return [];
  }

  const proxyUrls =
    raw ||
    "http://127.0.0.1:7890,http://127.0.0.1:7891,http://127.0.0.1:10809,http://127.0.0.1:1080";

  return proxyUrls
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function pushProxyCandidate(
  candidates: GeminiFetchCandidate[],
  label: "proxy" | "auto-proxy" | "relay-proxy",
  proxyUrl: string,
  seenProxyUrls: Set<string>
) {
  if (!proxyUrl || seenProxyUrls.has(proxyUrl)) {
    return;
  }

  seenProxyUrls.add(proxyUrl);
  const dispatcher = new ProxyAgent(proxyUrl);
  candidates.push({
    label,
    proxyUrl,
    fetch: async (url: string, options?: UndiciFetchOptions) =>
      undiciFetch(url, {
        ...((options ?? {}) as Record<string, unknown>),
        dispatcher,
      } as any),
  });
}

function buildGeminiFetchCandidates(): GeminiFetchCandidate[] {
  const proxy =
    process.env.GEMINI_DISABLE_PROXY === "1" ? "" : getExplicitGeminiProxyUrl();

  const candidates: GeminiFetchCandidate[] = [];
  const seenProxyUrls = new Set<string>();

  if (proxy) {
    pushProxyCandidate(candidates, "proxy", proxy, seenProxyUrls);
  }

  if (process.env.GEMINI_DISABLE_PROXY !== "1") {
    for (const autoProxyUrl of getAutoLocalProxyUrls()) {
      pushProxyCandidate(candidates, "auto-proxy", autoProxyUrl, seenProxyUrls);
    }
  }

  candidates.push({
    label: "direct",
    fetch: async (url: string, options?: UndiciFetchOptions) =>
      undiciFetch(url, options),
  });

  return candidates;
}

function buildRelayFetchCandidates(): GeminiFetchCandidate[] {
  const candidates: GeminiFetchCandidate[] = [];
  const seenProxyUrls = new Set<string>();
  const explicitProxy =
    process.env.GEMINI_DISABLE_PROXY === "1" ? "" : getExplicitGeminiProxyUrl();

  if (explicitProxy) {
    pushProxyCandidate(candidates, "relay-proxy", explicitProxy, seenProxyUrls);
  }

  if (process.env.GEMINI_DISABLE_PROXY !== "1") {
    for (const autoProxyUrl of getAutoLocalProxyUrls()) {
      pushProxyCandidate(candidates, "relay-proxy", autoProxyUrl, seenProxyUrls);
    }
  }

  candidates.push({
    label: "relay-direct",
    fetch: async (url: string, options?: UndiciFetchOptions) =>
      undiciFetch(url, options),
  });

  return candidates;
}

function resolveGeminiRelayEndpoint() {
  const raw = safeString(process.env.GEMINI_RELAY_URL).trim();
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/api/gemini/relay";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function getOverallTimeoutMs() {
  const raw = process.env.GEMINI_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120_000;
  }

  return Math.min(Math.max(parsed, 10_000), 240_000);
}

function extractGeminiImage(json: any): GeminiImageResult | null {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;

    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data && typeof inline.data === "string") {
        return {
          imageBase64: inline.data,
          mimeType:
            typeof inline.mimeType === "string" ? inline.mimeType : "image/png",
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

  return status
    ? `Gemini request failed (${status})`
    : "Gemini image generation failed";
}

function normalizeGeminiImages(payload: GenerateImagePayload) {
  const inputImages = Array.isArray(payload.images)
    ? payload.images
        .map((image) => ({
          imageBase64: safeString(image?.imageBase64).trim(),
          imageMimeType:
            safeString(image?.imageMimeType).trim() || "image/jpeg",
        }))
        .filter((image) => image.imageBase64.length > 0)
        .slice(0, 5)
    : [];

  if (inputImages.length > 0) {
    return inputImages;
  }

  const inputImageBase64 = safeString(payload.imageBase64).trim();
  if (!inputImageBase64) {
    return [];
  }

  return [
    {
      imageBase64: inputImageBase64,
      imageMimeType: safeString(payload.imageMimeType).trim() || "image/jpeg",
    },
  ];
}

function buildGeminiRequest(payload: GenerateImagePayload, apiKeyOverride = "") {
  const apiKey = apiKeyOverride || getRequiredEnv("GEMINI_API_KEY");

  const prompt = payload.prompt.trim() || DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;
  const modelId = payload.modelId.trim() || "gemini-3.1-flash-image-preview";
  const rawAspectRatio = safeString(payload.aspectRatio).trim();
  const aspectRatio =
    rawAspectRatio && rawAspectRatio.toLowerCase() !== "auto"
      ? rawAspectRatio
      : "";
  const inputImages = normalizeGeminiImages(payload);

  const parts: Array<Record<string, unknown>> = [
    {
      text: aspectRatio ? `${prompt}\nOutput aspect ratio: ${aspectRatio}` : prompt,
    },
  ];

  inputImages.forEach((inputImage) => {
    parts.push({
      inlineData: {
        mimeType: inputImage.imageMimeType,
        data: inputImage.imageBase64,
      },
    });
  });

  const requestUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  return {
    requestUrl,
    body: {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    },
  };
}

export async function requestGeminiImageDirect(
  payload: GenerateImagePayload,
  candidates = buildGeminiFetchCandidates(),
  apiKeyOverride = ""
): Promise<GeminiImageResult> {
  const { requestUrl, body } = buildGeminiRequest(payload, apiKeyOverride);
  const fetchCandidates = candidates;
  const attemptTimeoutMs = Math.min(
    Math.max(getOverallTimeoutMs(), 10_000),
    180_000
  );

  let response: Response | null = null;
  let rawText = "";
  let lastNetworkError: unknown = null;

  for (const candidate of fetchCandidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(
        new Error(
          `Gemini ${candidate.label} request timed out after ${attemptTimeoutMs}ms`
        )
      );
    }, attemptTimeoutMs);

    try {
      console.log("[Gemini][Network]", {
        mode: candidate.label,
        proxy: candidate.proxyUrl ? redactProxy(candidate.proxyUrl) : null,
      });

      response = (await candidate.fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      })) as unknown as Response;

      rawText = await response.text();
      lastNetworkError = null;
      break;
    } catch (error) {
      lastNetworkError = error;
      console.error("[Gemini][NetworkError]", {
        mode: candidate.label,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!response) {
    console.error("[Gemini][AllNetworkPathsFailed]", {
      message:
        lastNetworkError instanceof Error
          ? lastNetworkError.message
          : String(lastNetworkError || "unknown"),
    });
    throw new Error(GEMINI_NETWORK_ERROR_MESSAGE);
  }

  let json: any = null;
  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    json = null;
  }

  if (response.status === 503) {
    throw new Error(GEMINI_RETRYABLE_ERROR_MESSAGE);
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

async function requestGeminiImageViaRelay(
  payload: GenerateImagePayload
): Promise<GeminiImageResult> {
  const endpoint = resolveGeminiRelayEndpoint();
  const secret = safeString(process.env.GEMINI_RELAY_SECRET).trim();

  if (!endpoint) {
    throw new Error(GEMINI_NETWORK_ERROR_MESSAGE);
  }

  if (!secret) {
    throw new Error("Missing required environment variable: GEMINI_RELAY_SECRET");
  }

  let lastNetworkError: unknown = null;

  for (const candidate of buildRelayFetchCandidates()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error("Gemini relay request timed out"));
    }, getOverallTimeoutMs());

    try {
    console.log("[Gemini][Network]", {
      mode: candidate.label,
      proxy: candidate.proxyUrl ? redactProxy(candidate.proxyUrl) : null,
    });

    const relayPayload = {
      ...payload,
      geminiApiKey: safeString(process.env.GEMINI_API_KEY).trim(),
    };

    const response = (await candidate.fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gemini-relay-secret": secret,
      },
      signal: controller.signal,
      body: JSON.stringify(relayPayload),
    })) as unknown as Response;
    const rawText = await response.text();
    let json: any = null;

    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      throw new Error(buildGeminiFatalMessage(json, rawText, response.status));
    }

    if (!json?.imageBase64 || typeof json.imageBase64 !== "string") {
      throw new Error("Gemini relay did not return an image");
    }

    return {
      imageBase64: json.imageBase64,
      mimeType: safeString(json.mimeType) || "image/png",
    };
    } catch (error) {
      lastNetworkError = error;
      console.error("[Gemini][NetworkError]", {
        mode: candidate.label,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastNetworkError instanceof Error
    ? lastNetworkError
    : new Error(GEMINI_NETWORK_ERROR_MESSAGE);
}

export async function requestGeminiImage(
  payload: GenerateImagePayload
): Promise<GeminiImageResult> {
  const relayEndpoint = resolveGeminiRelayEndpoint();

  if (relayEndpoint && process.env.GEMINI_RELAY_FIRST !== "0") {
    try {
      return await requestGeminiImageViaRelay(payload);
    } catch (relayError) {
      console.error("[Gemini][RelayFirstError]", {
        message:
          relayError instanceof Error ? relayError.message : String(relayError),
      });
    }
  }

  try {
    return await requestGeminiImageDirect(payload);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === GEMINI_NETWORK_ERROR_MESSAGE &&
      relayEndpoint &&
      process.env.GEMINI_RELAY_FIRST === "0"
    ) {
      return requestGeminiImageViaRelay(payload);
    }

    throw error;
  }
}
