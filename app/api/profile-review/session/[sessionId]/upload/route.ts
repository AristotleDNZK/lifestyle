import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import {
  getCurrentUserId,
  replaceProfileReviewImages,
  requireProfileReviewAccess,
} from "@/lib/profile-review/session";
import { profileReviewJsonError } from "@/lib/profile-review/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    const accessToken = req.headers.get("x-profile-review-token");

    await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken,
      userId,
    });

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json(
        { error: "Please upload at least one image" },
        { status: 400 }
      );
    }

    await replaceProfileReviewImages({
      sessionId: params.sessionId,
      files,
    });

    await tasks.trigger("generate-profile-review", {
      sessionId: params.sessionId,
    });

    return NextResponse.json({
      success: true,
      status: "awaiting_analysis",
      currentStep: 20,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
