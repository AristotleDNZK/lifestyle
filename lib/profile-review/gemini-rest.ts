import type { ResponseSchema } from "@google/generative-ai";
import {
  ProxyAgent,
  fetch as undiciFetch,
  type Dispatcher,
} from "undici";

type GeminiEnv = Record<string, string | undefined>;

type InlineImageInput = {
  mimeType: string;
  base64: string;
};

type GeminiFetchInit = RequestInit & {
  dispatcher?: Dispatcher;
};

type GeminiResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

type GeminiFetch = (
  url: string,
  init?: GeminiFetchInit
) => Promise<GeminiResponse>;

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
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

function buildSystemInstruction(prompt: string) {
  return {
    role: "system" as const,
    parts: [{ text: prompt }],
  };
}

function buildGeminiFatalMessage(
  json: Record<string, unknown> | null,
  rawText: string,
  status?: number
) {
  const promptFeedback = json?.promptFeedback as
    | Record<string, unknown>
    | undefined;
  const promptBlocked =
    safeString(promptFeedback?.blockReasonMessage) ||
    safeString(promptFeedback?.blockReason);

  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
  const candidate =
    candidates.length > 0 && typeof candidates[0] === "object"
      ? (candidates[0] as Record<string, unknown>)
      : null;
  const finishMessage = safeString(candidate?.finishMessage);

  const error =
    json?.error && typeof json.error === "object"
      ? (json.error as Record<string, unknown>)
      : null;

  const upstreamMessage =
    safeString(error?.message) ||
    safeString(json?.message) ||
    promptBlocked ||
    finishMessage;

  if (upstreamMessage) {
    return upstreamMessage;
  }

  if (rawText) {
    return rawText.slice(0, 1000);
  }

  return status ? `Gemini request failed (${status})` : "Gemini request failed";
}

export function getGeminiProxyUrl(env: GeminiEnv = process.env) {
  return (
    env.GEMINI_PROXY_URL ||
    env.HTTPS_PROXY ||
    env.HTTP_PROXY ||
    env.ALL_PROXY ||
    ""
  );
}

export function buildGeminiFetchOptions(env: GeminiEnv = process.env): {
  dispatcher?: Dispatcher;
} {
  const proxy = getGeminiProxyUrl(env);

  if (!proxy) {
    return {};
  }

  return {
    dispatcher: new ProxyAgent(proxy),
  };
}

export function extractGeminiText(json: Record<string, unknown> | null) {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const content =
      "content" in candidate && candidate.content
        ? (candidate.content as Record<string, unknown>)
        : null;
    const parts = Array.isArray(content?.parts) ? content.parts : [];

    for (const part of parts) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = "text" in part ? safeString(part.text) : "";
      if (text) {
        return text;
      }
    }
  }

  return "";
}

function buildGenerateContentRequest(params: {
  prompt: string;
  inlineImages: InlineImageInput[];
  schema: ResponseSchema;
  temperature?: number;
}) {
  return {
    systemInstruction: buildSystemInstruction(params.prompt),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: params.schema,
      temperature: params.temperature ?? 0.4,
    },
    contents: [
      {
        role: "user" as const,
        parts: [
          { text: "Return JSON only." },
          ...params.inlineImages.map((image) => ({
            inlineData: {
              mimeType: image.mimeType,
              data: image.base64,
            },
          })),
        ],
      },
    ],
  };
}

export async function generateGeminiStructuredJson(params: {
  apiKey: string;
  modelName: string;
  prompt: string;
  inlineImages: InlineImageInput[];
  schema: ResponseSchema;
  timeoutMs: number;
  temperature?: number;
  env?: GeminiEnv;
  fetchImpl?: GeminiFetch;
}) {
  const env = params.env ?? process.env;
  const fetchImpl = params.fetchImpl ?? undiciFetch;
  const fetchOptions = buildGeminiFetchOptions(env);
  const proxy = getGeminiProxyUrl(env);

  if (proxy) {
    console.log("[ProfileReview][Gemini][Network]", {
      mode: "proxy",
      proxy: redactProxy(proxy),
    });
  }

  const controller = new AbortController();
  const timeoutMs = Math.min(Math.max(params.timeoutMs, 10_000), 240_000);
  const timeout = setTimeout(() => {
    controller.abort(
      new Error(`Gemini request timed out after ${timeoutMs}ms`)
    );
  }, timeoutMs);

  const requestUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      params.modelName
    )}` + `:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  let response: GeminiResponse | null = null;
  let rawText = "";

  try {
    response = await fetchImpl(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildGenerateContentRequest({
          prompt: params.prompt,
          inlineImages: params.inlineImages,
          schema: params.schema,
          temperature: params.temperature,
        })
      ),
      signal: controller.signal,
      ...fetchOptions,
    });

    rawText = await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini request failed: ${error.message}`);
    }

    throw new Error("Gemini request failed: Unknown network error");
  } finally {
    clearTimeout(timeout);
  }

  let json: Record<string, unknown> | null = null;
  try {
    json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(buildGeminiFatalMessage(json, rawText, response.status));
  }

  const text = extractGeminiText(json);
  if (!text) {
    throw new Error(buildGeminiFatalMessage(json, rawText, response.status));
  }

  return text;
}
