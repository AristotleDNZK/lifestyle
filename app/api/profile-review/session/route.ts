import { NextResponse } from "next/server";
import { createProfileReviewSession } from "@/lib/profile-review/session";
import { profileReviewJsonError } from "@/lib/profile-review/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await createProfileReviewSession();

    return NextResponse.json({
      sessionId: session.id,
      accessToken: session.access_token,
      currentStep: session.current_step,
      status: session.status,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
