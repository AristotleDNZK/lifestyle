import { NextResponse } from "next/server";
import { createProfileReviewSession } from "@/lib/profile-review/session";
import { profileReviewJsonError } from "@/lib/profile-review/http";
import {
  createLocalProfileReviewSession,
} from "@/lib/profile-review/local-dev-store";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth-shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    let session;
    try {
      session = await createProfileReviewSession();
    } catch (error) {
      if (!isLocalDevAuthEnabled()) {
        throw error;
      }

      console.warn("[ProfileReview][LocalDevSessionFallback]", error);
      session = createLocalProfileReviewSession();
    }

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
