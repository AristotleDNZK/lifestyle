import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/lib/credits";
import { profileReviewConfig } from "@/lib/profile-review/config";
import { sendProfileReviewReportEmail } from "@/lib/profile-review/email";
import {
  getProfileReviewReport,
  getProfileReviewSession,
  requireProfileReviewAccess,
  updateProfileReviewSession,
  upsertProfileReviewOrder,
} from "@/lib/profile-review/session";
import {
  getProfileReviewAccessToken,
  profileReviewJsonError,
} from "@/lib/profile-review/http";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import {
  isLocalProfileReviewSession,
  markLocalProfileReviewSessionPaid,
} from "@/lib/profile-review/local-dev-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId, email } = await getAppAuthSession();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const userEmail = email || `${userId}@temp.local`;
    if (!userEmail) {
      return NextResponse.json(
        { error: "No email address found for this account" },
        { status: 400 }
      );
    }

    const accessToken = getProfileReviewAccessToken(req);

    if (isLocalProfileReviewSession(params.sessionId)) {
      const session = markLocalProfileReviewSessionPaid({
        sessionId: params.sessionId,
        userId,
        email: userEmail,
        accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
      }

      const reportUrl = `/dating-profile-review/report/${params.sessionId}?accessToken=${encodeURIComponent(accessToken)}&payment=local&orderId=local_${params.sessionId}`;

      return NextResponse.json({
        success: true,
        emailSent: false,
        reportUrl,
        sessionEmail: userEmail,
        priorStatus: "analyzed",
      });
    }

    await ensureUserExists(userId, userEmail);

    await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken,
      userId,
    });

    const [session, report] = await Promise.all([
      getProfileReviewSession(params.sessionId),
      getProfileReviewReport(params.sessionId),
    ]);

    if (!report) {
      return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
    }

    const amountInCents = Math.round(profileReviewConfig.unlockPriceUsd * 100);

    await upsertProfileReviewOrder({
      sessionId: params.sessionId,
      userId,
      amount: amountInCents,
      status: "paid",
    });

    await updateProfileReviewSession(params.sessionId, {
      user_id: userId,
      email: userEmail,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    const reportUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/dating-profile-review/report/${params.sessionId}`;

    let emailSent = false;

    try {
      await sendProfileReviewReportEmail({
        to: userEmail,
        report: report.full_report,
        reportUrl,
      });
      emailSent = true;

      await updateProfileReviewSession(params.sessionId, {
        status: "delivered",
        delivered_at: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error("[ProfileReview][EmailDeliveryError]", emailError);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      reportUrl,
      sessionEmail: userEmail,
      priorStatus: session.status,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
