import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserId,
  requireProfileReviewAccess,
  saveProfileReviewAnswer,
} from "@/lib/profile-review/session";
import { profileReviewJsonError } from "@/lib/profile-review/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SaveAnswerBody = {
  stepKey?: string;
  question?: string;
  answerValue?: string;
  answerLabel?: string;
  rawPayload?: Record<string, unknown>;
  currentStep?: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = (await req.json()) as SaveAnswerBody;
    const userId = await getCurrentUserId();
    const accessToken = req.headers.get("x-profile-review-token");

    if (
      !body.stepKey ||
      !body.question ||
      !body.answerValue ||
      !body.answerLabel
    ) {
      return NextResponse.json({ error: "Missing answer payload" }, { status: 400 });
    }

    await requireProfileReviewAccess({
      sessionId: params.sessionId,
      accessToken,
      userId,
    });

    const answer = await saveProfileReviewAnswer({
      sessionId: params.sessionId,
      stepKey: body.stepKey,
      question: body.question,
      answerValue: body.answerValue,
      answerLabel: body.answerLabel,
      rawPayload: body.rawPayload,
      currentStep: body.currentStep,
    });

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
