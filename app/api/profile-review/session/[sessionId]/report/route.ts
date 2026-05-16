import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserId,
  getProfileReviewImagesWithUrls,
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
    const scope = req.nextUrl.searchParams.get("scope") || "preview";
    const accessToken = getProfileReviewAccessToken(req);

    if (isLocalProfileReviewSession(params.sessionId)) {
      const session = requireLocalProfileReviewAccess({
        sessionId: params.sessionId,
        accessToken: scope === "full" ? undefined : accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Review session not found" }, { status: 404 });
      }

      if (!session.previewReport || !session.fullReport) {
        return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
      }

      if (scope === "full" && !session.paid) {
        return NextResponse.json({ error: "Full report is locked" }, { status: 403 });
      }

      return NextResponse.json({
        session,
        images: session.images,
        report: scope === "full" ? session.fullReport : session.previewReport,
        unlocked: scope === "full",
      });
    }

    const userId = await getCurrentUserId();

    const session = await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken: scope === "full" ? undefined : accessToken,
      userId,
    });
    const report = await getProfileReviewReport(params.sessionId);

    if (!report) {
      return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
    }

    const images = await getProfileReviewImagesWithUrls(params.sessionId);

    if (scope === "full") {
      const order = await getProfileReviewOrder(params.sessionId);
      if (!userId || session.user_id !== userId || order?.status !== "paid") {
        return NextResponse.json({ error: "Full report is locked" }, { status: 403 });
      }

      return NextResponse.json({
        session,
        images,
        report: report.full_report,
        unlocked: true,
      });
    }

    return NextResponse.json({
      session,
      images,
      report: report.preview_report,
      unlocked: false,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
