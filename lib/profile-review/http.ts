import { NextRequest, NextResponse } from "next/server";
import { ProfileReviewError } from "@/lib/profile-review/session";

export function getProfileReviewAccessToken(req: NextRequest) {
  return (
    req.headers.get("x-profile-review-token") ||
    req.nextUrl.searchParams.get("accessToken") ||
    req.nextUrl.searchParams.get("token") ||
    ""
  );
}

export function profileReviewJsonError(error: unknown) {
  if (error instanceof ProfileReviewError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[ProfileReview][UnhandledError]", error);
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Internal server error",
    },
    { status: 500 }
  );
}
