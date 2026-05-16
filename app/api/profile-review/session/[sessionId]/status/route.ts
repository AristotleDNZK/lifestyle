import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserId,
  getProfileReviewOrder,
  getProfileReviewReport,
  requireProfileReviewAccess,
} from "@/lib/profile-review/session";
import {
  getProfileReviewAccessToken,
  profileReviewJsonError,
} from "@/lib/profile-review/http";
import {
  isLocalProfileReviewSession,
  requireLocalProfileReviewAccess,
} from "@/lib/profile-review/local-dev-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const accessToken = getProfileReviewAccessToken(req);

    if (isLocalProfileReviewSession(params.sessionId)) {
      const session = requireLocalProfileReviewAccess({
        sessionId: params.sessionId,
        accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Review session not found" }, { status: 404 });
      }

      return NextResponse.json({
        sessionId: session.id,
        status: session.status,
        currentStep: session.current_step,
        previewScore: session.preview_score,
        reportReady: Boolean(session.previewReport),
        isUnlocked: false,
      });
    }

    const userId = await getCurrentUserId();

    const session = await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken,
      userId,
    });

    const [report, order] = await Promise.all([
      getProfileReviewReport(params.sessionId),
      getProfileReviewOrder(params.sessionId),
    ]);

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      currentStep: session.current_step,
      previewScore: session.preview_score,
      reportReady: Boolean(report),
      isUnlocked: order?.status === "paid" && session.user_id === userId,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
