import { ProfileReviewQuizClient } from "@/app/dating-profile-review/_components/profile-review-quiz-client";

export const dynamic = "force-dynamic";

export default function DatingProfileReviewQuizPage() {
  const unlockPriceUsd = Number(process.env.PROFILE_REVIEW_UNLOCK_PRICE_USD || "3.99");

  return <ProfileReviewQuizClient unlockPriceUsd={unlockPriceUsd} />;
}
