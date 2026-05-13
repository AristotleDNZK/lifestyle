"use client";

import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProfileReviewLogo } from "@/app/dating-profile-review/_components/profile-review-shell";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function DatingProfileReviewCheckoutPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const sessionId = params.sessionId;
  const accessToken = searchParams.get("accessToken") || searchParams.get("token") || "";
  const price = Number(process.env.NEXT_PUBLIC_PROFILE_REVIEW_UNLOCK_PRICE_USD || "3.99");
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/payments/profile-review/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, accessToken }),
      });

      const data = (await response.json()) as {
        error?: string;
        orderId?: string;
        paddlePriceId?: string;
        customData?: Record<string, unknown>;
        email?: string;
      };

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Paddle checkout failed"
        );
      }

      if (!data.paddlePriceId || !data.orderId) {
        throw new Error("Paddle checkout response is incomplete");
      }

      if (!window.Paddle) {
        throw new Error("Paddle checkout is still loading. Please try again in a moment.");
      }

      window.Paddle?.Checkout.open({
        items: [{ priceId: data.paddlePriceId, quantity: 1 }],
        customData: data.customData,
        customer: data.email || email ? { email: data.email || email } : undefined,
        settings: {
          successUrl: `${window.location.origin}/dating-profile-review/report/${sessionId}?payment=paddle&orderId=${data.orderId}`,
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paddle checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151824] text-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#63f276]" />
          <p className="mt-5 text-sm uppercase tracking-[0.14em] text-white/45">
            Loading checkout
          </p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151824] px-4 text-white">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#11131b] p-8 text-center">
          <ProfileReviewLogo href="/" />
          <h1 className="mt-6 text-3xl font-black uppercase tracking-[-0.03em]">
            Sign in required
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            You need to sign in before continuing to the checkout flow.
          </p>
          <div className="mt-8 grid gap-3">
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/dating-profile-review/checkout/${sessionId}?accessToken=${accessToken}`)}`}
              className="inline-flex min-h-[56px] items-center justify-center rounded-sm bg-[#63f276] px-6 text-base font-black uppercase tracking-[0.06em] text-[#081009]"
            >
              Sign in
            </Link>
            <Link
              href={`/dating-profile-review/unlock/${sessionId}?accessToken=${encodeURIComponent(accessToken)}`}
              className="inline-flex min-h-[56px] items-center justify-center rounded-sm border border-white/18 px-6 text-base font-bold uppercase tracking-[0.05em] text-white"
            >
              Back to unlock
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efefef] text-[#121318]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-[#171a24] px-6 py-8 text-white sm:px-10 lg:px-14">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/75 transition hover:border-white/20 hover:bg-white/10"
              aria-label="Go back"
            >
              {"<"}
            </button>
            <ProfileReviewLogo href="/" />
            <div className="w-10" />
          </div>

          <div className="mt-12 max-w-md">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#63f276]">
              Payment
            </div>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em]">
              US${price.toFixed(2)}
            </h1>
            <p className="mt-2 text-lg text-white/55">
              then US$29.00 / month in the reference layout
            </p>

            <div className="mt-12 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">Unlock Trial</div>
                  <div className="mt-1 text-sm text-white/50">
                    Full access to the dating profile review report
                  </div>
                </div>
                <div className="text-lg font-bold text-white">US${price.toFixed(2)}</div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">Roast Pro</div>
                  <div className="mt-1 text-sm text-white/50">
                    Reference offer layout preserved for the checkout experience
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">7 days free</div>
                  <div className="mt-1 text-sm text-white/45">US$29.00 / month after</div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-sm text-white/55">
                <span>Subtotal</span>
                <span>US${price.toFixed(2)}</span>
              </div>
              <div className="mt-6 flex items-center justify-between text-lg font-bold text-white">
                <span>Total due today</span>
                <span>US${price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f3f2ef] px-6 py-8 sm:px-10 lg:px-14">
          <div className="mx-auto max-w-xl">
            <div className="rounded-[28px] border border-[#d9d7d2] bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:p-8">
              <h2 className="text-3xl font-black tracking-[-0.03em] text-[#14161d]">
                Enter payment details
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5f6470]">
                Continue to secure checkout. The report unlocks after Paddle confirms payment.
              </p>

              <div className="mt-6 rounded-2xl border border-[#e5e3de] bg-[#faf9f7] px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#6c7380]">
                  Email
                </div>
                <div className="mt-1 text-sm font-medium text-[#1d222d]">{email}</div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={!userId || !email || submitting}
                className={classes(
                  "mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#171a24] px-6 text-base font-black uppercase tracking-[0.06em] text-white transition",
                  "hover:bg-[#222738] disabled:cursor-not-allowed disabled:bg-[#8f94a0]"
                )}
              >
                {submitting ? "Unlocking report..." : "Pay and start trial"}
              </button>

              <p className="mt-4 text-center text-xs leading-6 text-[#6b6f79]">
                Payment confirmation unlocks the report on-site and sends the full report to your email.
              </p>

              {error ? <p className="mt-4 text-center text-sm text-[#cf4c4c]">{error}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
