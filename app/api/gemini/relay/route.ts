import { NextRequest, NextResponse } from "next/server";
import {
  requestGeminiImageDirect,
  type GenerateImagePayload,
} from "@/lib/gemini-image-generation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isAuthorized(req: NextRequest) {
  const expectedSecret = safeString(process.env.GEMINI_RELAY_SECRET).trim();
  if (!expectedSecret) {
    return false;
  }

  return req.headers.get("x-gemini-relay-secret") === expectedSecret;
}

function buildErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return "Gemini relay failed";
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: GenerateImagePayload;
  try {
    payload = (await req.json()) as GenerateImagePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await requestGeminiImageDirect(payload, [
      {
        label: "direct",
        fetch: async (url, options) => fetch(url, options as RequestInit),
      },
    ], safeString(payload.geminiApiKey).trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GeminiRelay][Error]", {
      message: buildErrorMessage(error),
    });

    return NextResponse.json(
      { error: "Gemini relay failed", message: buildErrorMessage(error) },
      { status: 502 }
    );
  }
}
