import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generateImage,
  downloadImage,
  type AspectRatio,
} from "@/lib/volcengine";
import { uploadToImgBB, EXPIRATION } from "@/lib/imgbb";
import { Agent } from "undici";
import { HttpsProxyAgent } from "https-proxy-agent";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeminiGenerateRequest = {
  prompt: string;
  ratio?: string;
  model?: string;
  imageBase64: string;
  imageMimeType?: string;
};

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

let cachedDispatcher: any | null = null;
let cachedDispatcherKey = "";

function redactProxy(proxyUrl: string) {
  try {
    const u = new URL(proxyUrl);
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${u.hostname}${port}`;
  } catch {
    return "invalid-proxy-url";
  }
}

function getGeminiDispatcher() {
  const proxy =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    "";

  const key = proxy ? `proxy:${proxy}` : "direct";
  if (cachedDispatcher && cachedDispatcherKey === key) return cachedDispatcher;

  cachedDispatcherKey = key;
  if (proxy) {
    // Use https-proxy-agent for better compatibility with Clash/V2Ray
    cachedDispatcher = new HttpsProxyAgent(proxy, {
      timeout: 30_000,
    } as any);
    console.log("[Gemini][Network]", { mode: "proxy", proxy: redactProxy(proxy) });
    return cachedDispatcher;
  }

  // Also increase connect timeout for direct mode (Node fetch default can be ~10s).
  cachedDispatcher = new Agent({ connectTimeout: 30_000 } as any);
  console.log("[Gemini][Network]", { mode: "direct" });
  return cachedDispatcher;
}

function getOverallTimeoutMs() {
  const raw = process.env.GEMINI_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  // Default longer timeout for local debugging; Vercel can still be capped by maxDuration.
  if (!Number.isFinite(parsed) || parsed <= 0) return 120_000;
  return Math.min(Math.max(parsed, 10_000), 240_000);
}

function normalizeModelId(model: string) {
  const m = model.trim();
  if (!m) return "";
  return m.startsWith("models/") ? m.slice("models/".length) : m;
}

function mapUiModelToGeminiModel(uiModel: string) {
  switch (uiModel) {
    case "nano-banana-edit":
      return "nano-banana-pro-preview";
    case "seedance-edit-fast":
      return "gemini-3.1-flash-image-preview";
    case "seedance-edit-pro":
      return "gemini-3-pro-image-preview";
    default:
      return "";
  }
}

function looksLikeGeminiImageModelId(value: string) {
  const v = value.trim();
  if (!v) return false;
  const id = normalizeModelId(v);
  return (
    id.startsWith("gemini-") ||
    id.startsWith("nano-banana-")
  );
}

function presetStrategy(presetId: string) {
  switch (presetId) {
    case "auto-fast":
      return {
        primary: "gemini-3.1-flash-image-preview",
        fallbacks: [
          "gemini-2.5-flash-image",
          "nano-banana-pro-preview",
          "gemini-2.0-flash-exp-image-generation",
          "gemini-3-pro-image-preview",
        ],
      };
    case "auto-balanced":
      return {
        primary: "gemini-2.5-flash-image",
        fallbacks: [
          "gemini-3.1-flash-image-preview",
          "nano-banana-pro-preview",
          "gemini-2.0-flash-exp-image-generation",
          "gemini-3-pro-image-preview",
        ],
      };
    case "auto-edit":
      return {
        primary: "nano-banana-pro-preview",
        fallbacks: [
          "gemini-3.1-flash-image-preview",
          "gemini-2.5-flash-image",
          "gemini-3-pro-image-preview",
          "gemini-2.0-flash-exp-image-generation",
        ],
      };
    case "auto-quality":
      return {
        primary: "gemini-3-pro-image-preview",
        fallbacks: [
          "nano-banana-pro-preview",
          "gemini-3.1-flash-image-preview",
          "gemini-2.5-flash-image",
          "gemini-2.0-flash-exp-image-generation",
        ],
      };
    case "auto-experimental":
      return {
        primary: "gemini-2.0-flash-exp-image-generation",
        fallbacks: [
          "gemini-3.1-flash-image-preview",
          "gemini-2.5-flash-image",
          "nano-banana-pro-preview",
          "gemini-3-pro-image-preview",
        ],
      };
    default:
      return null;
  }
}

function uniqueModels(models: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of models) {
    const id = normalizeModelId(m);
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function extractGeminiImage(json: any): { imageBase64: string; mimeType: string } | null {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
  for (const cand of candidates) {
    const parts = cand?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data && typeof inline.data === "string") {
        return {
          imageBase64: inline.data,
          mimeType: typeof inline.mimeType === "string" ? inline.mimeType : "image/jpeg",
        };
      }
    }
  }
  return null;
}

async function handleGeminiImageToImage(req: NextRequest, body: GeminiGenerateRequest) {
  try {
    const reqId = randomUUID();
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const prompt = safeString(body.prompt).trim();
    const imageBase64 = safeString(body.imageBase64).trim();
    const imageMimeType = safeString(body.imageMimeType).trim() || "image/jpeg";
    const ratio = safeString(body.ratio).trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const text =
      "\u8bf7\u6839\u636e\u56fe\u7247\u548c\u8981\u6c42\u8fdb\u884c\u91cd\u7ed8\uff1a" +
      prompt +
      (ratio ? `\n\u8f93\u51fa\u6bd4\u4f8b: ${ratio}` : "");

    const payload = {
      contents: [
        {
          parts: [
            { text },
            {
              inlineData: {
                mimeType: imageMimeType || "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    };

    const uiModel = safeString(body.model).trim();
    const envPrimary = safeString(process.env.GEMINI_IMAGE_MODEL).trim();
    const envFallback = safeString(process.env.GEMINI_FALLBACK_MODELS).trim();
    const fallbackFromEnv = envFallback
      ? envFallback.split(",").map((s) => s.trim())
      : [
          "gemini-3.1-flash-image-preview",
          "nano-banana-pro-preview",
          "gemini-2.5-flash-image",
          "gemini-2.0-flash-exp-image-generation",
          "gemini-3-pro-image-preview",
        ];

    const preset = presetStrategy(uiModel);
    const primaryFromUi = preset
      ? preset.primary
      : looksLikeGeminiImageModelId(uiModel)
        ? normalizeModelId(uiModel)
        : normalizeModelId(mapUiModelToGeminiModel(uiModel));

    // UI selection wins. Env primary is only used as a default.
    const primaryModel =
      primaryFromUi ||
      normalizeModelId(envPrimary) ||
      "gemini-3-pro-image-preview";

    const fallbackModels = preset?.fallbacks?.length
      ? [...preset.fallbacks, ...fallbackFromEnv]
      : fallbackFromEnv;

    const modelsToTry = uniqueModels([primaryModel, ...fallbackModels]);
    const overallTimeoutMs = getOverallTimeoutMs();

    console.log("[Gemini][RequestPayload]", {
      reqId,
      uiModel,
      primaryModel,
      modelsToTry,
      ratio,
      promptLen: prompt.length,
      imageMimeType,
      imageBase64Len: imageBase64.length,
      imageBase64Preview: imageBase64.slice(0, 50),
      overallTimeoutMs,
      payloadShape: {
        contents: [
          {
            parts: [
              { textPreview: text.slice(0, 120) },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  dataPreview: imageBase64.slice(0, 50),
                },
              },
            ],
          },
        ],
      },
    });

    const deadline = Date.now() + overallTimeoutMs;
    const dispatcher = getGeminiDispatcher();

    let lastError: { status?: number; message: string } | null = null;

    for (let mi = 0; mi < modelsToTry.length; mi += 1) {
      const modelId = modelsToTry[mi]!;
      const remaining = Math.max(0, deadline - Date.now());
      if (remaining < 5_000) break;

      // Give the primary model more budget; keep fallbacks tighter.
      const attemptTimeoutMs =
        mi === 0 ? Math.min(remaining, 120_000) : Math.min(remaining, 60_000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      console.log("[Gemini][TryModel]", {
        reqId,
        modelId,
        attemptTimeoutMs,
        remainingMs: remaining,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort(new Error(`Gemini request timed out after ${attemptTimeoutMs}ms`));
      }, attemptTimeoutMs);

      const startedAt = Date.now();
      let res: Response | null = null;
      let rawText = "";

      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          // @ts-expect-error - RequestInit typing doesn't include undici dispatcher.
          dispatcher,
          body: JSON.stringify(payload),
        });
        rawText = await res.text();
      } catch (error: any) {
        console.error("【后端完整报错日志】:", error.name, error.message, error.cause);
        console.error(error.stack);
        lastError = { message: error?.message || "Gemini fetch failed" };
      } finally {
        clearTimeout(timeout);
        console.log("[Gemini][ResponseMeta]", {
          reqId,
          modelId,
          ok: res?.ok ?? false,
          status: res?.status ?? null,
          elapsedMs: Date.now() - startedAt,
          rawTextPreview: rawText ? rawText.slice(0, 220) : "",
          aborted: controller.signal.aborted,
        });
      }

      if (!res) {
        continue;
      }

      let json: any = null;
      try {
        json = rawText ? JSON.parse(rawText) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const msg =
          safeString(json?.error?.message) ||
          safeString(json?.message) ||
          rawText ||
          `Gemini request failed (${res.status})`;
        lastError = { status: res.status, message: msg };

        console.error("[Gemini][UpstreamError]", {
          reqId,
          modelId,
          status: res.status,
          message: msg,
          responsePreview: rawText ? rawText.slice(0, 1200) : "",
        });

        // Retry a bit on transient overload/rate-limit (keep within overall budget).
        if (res.status === 503 || res.status === 429) {
          const waitMs = 1200 + Math.floor(Math.random() * 600);
          const still = Math.max(0, deadline - Date.now());
          if (still > waitMs + 5_000) {
            console.log("[Gemini][RetryAfter]", { modelId, waitMs, status: res.status });
            await sleep(waitMs);
            mi -= 1;
            continue;
          }
        }

        continue;
      }

      const extracted = extractGeminiImage(json);
      if (!extracted?.imageBase64) {
        lastError = { status: 502, message: "No image returned from Gemini" };
        console.error("[Gemini][NoImageInResponse]", {
          reqId,
          modelId,
          responsePreview: rawText ? rawText.slice(0, 2000) : "",
        });
        continue;
      }

      return NextResponse.json({
        success: true,
        imageBase64: extracted.imageBase64,
        mimeType: extracted.mimeType,
        modelId,
      });
    }

    return NextResponse.json(
      {
        error: lastError?.message || `Gemini request timed out after ${overallTimeoutMs}ms`,
        status: lastError?.status,
        modelsTried: modelsToTry,
      },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("【后端完整报错日志】:", error.name, error.message, error.cause);
    console.error(error.stack);
    return NextResponse.json(
      { error: error?.message || "Internal server error", name: error?.name },
      { status: 500 }
    );
  }
}

/**
 * AI Generation API Route
 * Handles both image and video generation requests
 *
 * Flow:
 * 1. Authenticate user
 * 2. Deduct credits (using RPC for atomic operation)
 * 3. Branch based on type:
 *    - Image: Generate → Download → Upload to ImgBB → Save to DB
 *    - Video: Return "coming soon" message (no deduction, no generation)
 * 4. Error handling: Refund credits if generation fails
 *
 * Storage: Uses ImgBB (free unlimited storage with optional expiration)
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
    // If the request includes `imageBase64`, treat it as Image-to-Image (Gemini).
    // This keeps the existing text-to-image/video API behavior intact for other pages.
    let maybeBody: any = null;
    try {
      maybeBody = await req.json();
    } catch (error: any) {
      console.error("【后端完整报错日志】:", error.name, error.message, error.cause);
      console.error(error.stack);
      return NextResponse.json(
        { error: "Invalid JSON body", name: error?.name },
        { status: 400 }
      );
    }

    if (
      maybeBody &&
      typeof maybeBody === "object" &&
      typeof maybeBody.imageBase64 === "string"
    ) {
      return await handleGeminiImageToImage(req, maybeBody as GeminiGenerateRequest);
    }

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
    const body = maybeBody;
    const { type, prompt, aspectRatio, seed, scale } = body || {};

    // Validate type
    if (!type || !["image", "video"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    generationType = type as "image" | "video";

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

    // Step 0: Ensure user exists in database (auto-create with free credits)
    console.log(`Checking if user ${userId} exists in database...`);

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, credits, email")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      console.log("User not found - creating new user with 10 free credits");

      const userEmail = `${userId}@temp.local`;

      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: userEmail,
          credits: 10, // Free credits for new users
        });

      if (insertError) {
        console.error("Failed to create user:", insertError);
        return NextResponse.json(
          { error: "Failed to initialize user account. Please try again." },
          { status: 500 }
        );
      }

      console.log(`New user created successfully with 10 free credits`);
    } else {
      console.log(`User found with ${existingUser.credits} credits`);
    }

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

    // Step D: Upload to ImgBB (free unlimited storage)
    console.log("Uploading image to ImgBB...");
    const imgbbResult = await uploadToImgBB(imageBuffer, {
      expiration: EXPIRATION.SEVEN_DAYS, // 7天自动过期
      name: `ai-gen-${Date.now()}`,
    });
    console.log("Image uploaded to ImgBB:", imgbbResult.url);

    // Step E: Save generation record to database
    console.log("Saving generation record to database...");

    const { error: insertError } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        type: "image",
        prompt: prompt.trim(),
        url: imgbbResult.url,
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
      url: imgbbResult.url,
      deleteUrl: imgbbResult.deleteUrl,
      expiresAt: imgbbResult.expiresAt,
      prompt: prompt.trim(),
      creditsUsed: costInCredits,
      requestId: volcengineResult.requestId,
    });
  } catch (error: any) {
    console.error("【后端完整报错日志】:", error.name, error.message, error.cause);
    console.error(error.stack);

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
