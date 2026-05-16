import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/lib/credits";
import { attachProfileReviewSessionToUser } from "@/lib/profile-review/session";
import {
  getProfileReviewAccessToken,
  profileReviewJsonError,
} from "@/lib/profile-review/http";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import {
  attachLocalProfileReviewSessionToUser,
  isLocalProfileReviewSession,
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
    const accessToken = getProfileReviewAccessToken(req);

    if (isLocalProfileReviewSession(params.sessionId)) {
      const session = attachLocalProfileReviewSessionToUser({
        sessionId: params.sessionId,
        userId,
        email: userEmail,
        accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Review session not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        userId: session.user_id,
        email: session.email,
      });
    }

    await ensureUserExists(userId, userEmail);

    const session = await attachProfileReviewSessionToUser({
      sessionId: params.sessionId,
      userId,
      accessToken,
      email: userEmail,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      userId: session.user_id,
      email: session.email,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
