import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import {
  getCurrentUserId,
  replaceProfileReviewImages,
  requireProfileReviewAccess,
} from "@/lib/profile-review/session";
import { profileReviewJsonError } from "@/lib/profile-review/http";
import {
  completeLocalProfileReviewUpload,
  isLocalProfileReviewSession,
  requireLocalProfileReviewAccess,
} from "@/lib/profile-review/local-dev-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const accessToken = req.headers.get("x-profile-review-token");
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

    if (isLocalProfileReviewSession(params.sessionId)) {
      const session = requireLocalProfileReviewAccess({
        sessionId: params.sessionId,
        accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Review session not found" }, { status: 404 });
      }

      await completeLocalProfileReviewUpload({
        sessionId: params.sessionId,
        files,
      });

      return NextResponse.json({
        success: true,
        status: "analyzed",
        currentStep: 21,
      });
    }

    const userId = await getCurrentUserId();

    await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken,
      userId,
    });

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
