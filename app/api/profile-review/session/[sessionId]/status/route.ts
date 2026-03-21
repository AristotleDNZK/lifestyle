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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    const accessToken = getProfileReviewAccessToken(req);

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
