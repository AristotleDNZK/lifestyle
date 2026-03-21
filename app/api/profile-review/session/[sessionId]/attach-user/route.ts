import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/credits";
import {
  attachProfileReviewSessionToUser,
  getCurrentUserId,
} from "@/lib/profile-review/session";
import {
  getProfileReviewAccessToken,
  profileReviewJsonError,
} from "@/lib/profile-review/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || `${userId}@temp.local`;

    await ensureUserExists(userId, email);

    const session = await attachProfileReviewSessionToUser({
      sessionId: params.sessionId,
      userId,
      accessToken: getProfileReviewAccessToken(req),
      email,
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
