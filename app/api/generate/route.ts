import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generateImage,
  downloadImage,
  type AspectRatio,
} from "@/lib/volcengine";
import { uploadToImgBB, EXPIRATION } from "@/lib/imgbb";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "node-fetch";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
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

function redactProxy(proxyUrl: string) {
  try {
    const u = new URL(proxyUrl);
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${u.hostname}${port}`;
  } catch {
    return "invalid-proxy-url";
  }
}

// Create a custom fetch function that works with proxy
function getProxiedFetch() {
  const proxy =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    "";

  if (proxy) {
    console.log("[Gemini][Network]", { mode: "proxy", proxy: redactProxy(proxy) });
    const agent = new HttpsProxyAgent(proxy);

    // Return a custom fetch that uses node-fetch with proxy agent
    return async (url: string, options: any = {}) => {
      return nodeFetch(url, {
        ...options,
        agent,
        timeout: 180000, // 3 minutes
      });
    };
  }

  console.log("[Gemini][Network]", { mode: "direct" });
  // Return regular node-fetch for direct connection
  return async (url: string, options: any = {}) => {
    return nodeFetch(url, {
      ...options,
      timeout: 180000,
    });
  };
}

function getOverallTimeoutMs() {
  const raw = process.env.GEMINI_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  // Default longer timeout for local debugging; Vercel can still be capped by maxDuration.
  if (!Number.isFinite(parsed) || parsed <= 0) return 120_000;
  return Math.min(Math.max(parsed, 10_000), 240_000);
}

const MODEL_MAP: Record<string, string> = {
  standard: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  auto: "gemini-3.1-flash-image-preview",
  default: "gemini-3.1-flash-image-preview",
};

const MODEL_COST_MAP: Record<string, number> = {
  standard: 2,
  auto: 3,
  pro: 4,
};

function resolveModelValue(value: string) {
  const key = value.trim().toLowerCase();
  if (key in MODEL_MAP) return key;
  return "default";
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

async function refundCredits(userId: string, amount: number) {
  const { error } = await supabaseAdmin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) {
    console.error("[Gemini][CreditRefundError]", { userId, amount, error });
  }
}

async function handleGeminiImageToImage(_req: NextRequest, body: GeminiGenerateRequest) {
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
      "请根据图片和要求进行重绘：" +
      prompt +
      (ratio ? `\n输出比例: ${ratio}` : "");

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

    const selectedModelValue = resolveModelValue(safeString(body.model));
    const modelId = MODEL_MAP[selectedModelValue] || MODEL_MAP.default;
    const modelCost = MODEL_COST_MAP[selectedModelValue] ?? MODEL_COST_MAP.auto;
    const overallTimeoutMs = getOverallTimeoutMs();

    const userId = authResult.userId;
    const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc(
      "deduct_credits",
      {
        p_user_id: userId,
        p_amount: modelCost,
      }
    );

    if (deductError) {
      console.error("[Gemini][CreditDeductError]", deductError);
      return NextResponse.json(
        { error: "Failed to deduct credits. Please try again." },
        { status: 500 }
      );
    }

    if (!deductSuccess) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: modelCost,
          message: "Please purchase more credits to continue generating images.",
        },
        { status: 402 }
      );
    }

    console.log("[Gemini][RequestPayload]", {
      reqId,
      selectedModelValue,
      modelId,
      modelCost,
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

    const customFetch = getProxiedFetch();
    const attemptTimeoutMs = Math.min(Math.max(overallTimeoutMs, 10_000), 180_000);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    console.log("[Gemini][TryModel]", {
      reqId,
      modelId,
      attemptTimeoutMs,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error(`Gemini request timed out after ${attemptTimeoutMs}ms`));
    }, attemptTimeoutMs);

    const startedAt = Date.now();
    let res: Response | null = null;
    let rawText = "";

    try {
      const fetchedRes = (await customFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      })) as any;
      res = fetchedRes;
      rawText = await fetchedRes.text();
    } catch (error: any) {
      console.error("【后端完整报错日志】:", error.name, error.message, error.cause);
      console.error(error.stack);
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
      await refundCredits(userId, modelCost);
      return NextResponse.json(
        { error: "Gemini fetch failed", modelTried: modelId },
        { status: 502 }
      );
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

      console.error("[Gemini][UpstreamError]", {
        reqId,
        modelId,
        status: res.status,
        message: msg,
        responsePreview: rawText ? rawText.slice(0, 1200) : "",
      });

      await refundCredits(userId, modelCost);

      return NextResponse.json(
        { error: msg, status: res.status, modelTried: modelId },
        { status: 502 }
      );
    }

    const extracted = extractGeminiImage(json);
    if (!extracted?.imageBase64) {
      console.error("[Gemini][NoImageInResponse]", {
        reqId,
        modelId,
        responsePreview: rawText ? rawText.slice(0, 2000) : "",
      });

      await refundCredits(userId, modelCost);

      return NextResponse.json(
        { error: "No image returned from Gemini", modelTried: modelId },
        { status: 502 }
      );
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      await refundCredits(userId, modelCost);
      return NextResponse.json(
        { error: "Missing IMGBB_API_KEY" },
        { status: 500 }
      );
    }

    const imgbbBody = new FormData();
    imgbbBody.append("image", extracted.imageBase64);

    let imgbbRes: Response;
    let imgbbText = "";
    try {
      imgbbRes = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbApiKey)}`,
        {
          method: "POST",
          body: imgbbBody,
        }
      );
      imgbbText = await imgbbRes.text();
    } catch (error: any) {
      console.error("[Gemini][ImgBBUploadNetworkError]", {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
      });
      await refundCredits(userId, modelCost);
      return NextResponse.json(
        { error: "Failed to upload image to ImgBB (network error)." },
        { status: 502 }
      );
    }

    let imgbbJson: any = null;
    try {
      imgbbJson = imgbbText ? JSON.parse(imgbbText) : null;
    } catch {
      imgbbJson = null;
    }

    if (!imgbbRes.ok || !imgbbJson?.success) {
      console.error("[Gemini][ImgBBUploadError]", {
        status: imgbbRes.status,
        responsePreview: imgbbText.slice(0, 800),
      });
      await refundCredits(userId, modelCost);
      return NextResponse.json(
        { error: "Failed to upload image to ImgBB." },
        { status: 502 }
      );
    }

    const imgbbUrl = String(
      imgbbJson?.data?.url || imgbbJson?.data?.display_url || ""
    ).trim();
    if (!imgbbUrl) {
      console.error("[Gemini][ImgBBMissingUrl]", {
        responsePreview: imgbbText.slice(0, 800),
      });
      await refundCredits(userId, modelCost);
      return NextResponse.json(
        { error: "ImgBB upload succeeded but URL is missing." },
        { status: 502 }
      );
    }

    const record = {
      user_id: userId,
      type: "image",
      prompt,
      url: imgbbUrl,
      image_url: imgbbUrl,
      cost: modelCost,
      status: "completed",
      model_id: modelId,
      aspect_ratio: ratio || null,
    };

    const { error: insertError } = await supabaseAdmin
      .from("generations")
      .insert(record);

    if (insertError) {
      console.error("[Gemini][InsertGenerationError]", insertError);
      // Fallback insert for older schema that may not include model_id/aspect_ratio columns
      const { error: fallbackInsertError } = await supabaseAdmin
        .from("generations")
        .insert({
          user_id: userId,
          type: "image",
          prompt,
          url: imgbbUrl,
          cost: modelCost,
          status: "completed",
        });

      if (fallbackInsertError) {
        console.error("[Gemini][InsertGenerationFallbackError]", fallbackInsertError);
        await refundCredits(userId, modelCost);
        return NextResponse.json(
          { error: "Failed to save generation history." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      creditsUsed: modelCost,
      imageUrl: imgbbUrl,
    });
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
 *    - Image: Generate 鈫?Download 鈫?Upload to ImgBB 鈫?Save to DB
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
      console.error("銆愬悗绔畬鏁存姤閿欐棩蹇椼€?", error.name, error.message, error.cause);
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
      expiration: EXPIRATION.SEVEN_DAYS, // 7澶╄嚜鍔ㄨ繃鏈?      name: `ai-gen-${Date.now()}`,
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
    console.error("銆愬悗绔畬鏁存姤閿欐棩蹇椼€?", error.name, error.message, error.cause);
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

