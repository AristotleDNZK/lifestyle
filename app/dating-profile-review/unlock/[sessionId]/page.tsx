"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ProfileReviewLogo,
  ProfileReviewPrimaryButton,
  ProfileReviewSecondaryButton,
} from "@/app/dating-profile-review/_components/profile-review-shell";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function DatingProfileReviewUnlockPage() {
  const params = useParams<{ sessionId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();
  const [attaching, setAttaching] = useState(false);
  const [attached, setAttached] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const accessToken = searchParams.get("accessToken") || searchParams.get("token") || "";
  const sessionId = params.sessionId;
  const unlockPriceUsd = Number(process.env.NEXT_PUBLIC_PROFILE_REVIEW_UNLOCK_PRICE_USD || "3.99");

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isLoaded || !userId || !sessionId || attaching || attached) {
      return;
    }

    let cancelled = false;

    async function attachSession() {
      try {
        setAttaching(true);
        setAttachError(null);

        const response = await fetch(`/api/profile-review/session/${sessionId}/attach-user`, {
          method: "POST",
          headers: accessToken ? { "x-profile-review-token": accessToken } : undefined,
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Failed to attach session to your account"
          );
        }

        if (!cancelled) {
          setAttached(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAttachError(
            error instanceof Error ? error.message : "Failed to attach session"
          );
        }
      } finally {
        if (!cancelled) {
          setAttaching(false);
        }
      }
    }

    void attachSession();

    return () => {
      cancelled = true;
    };
  }, [accessToken, attached, attaching, isLoaded, sessionId, userId]);

  return (
    <main className="dpai-page dpai-grid-bg min-h-screen overflow-hidden text-white">
      <div className="sticky top-0 z-10 flex h-10 items-center justify-between bg-[#d4d4d8] px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]">
        <span>Discount ends in</span>
        <span>09 - 49 - 30</span>
      </div>

      <div className="relative min-h-[calc(100vh-2.5rem)]">
        <div className="pointer-events-none absolute inset-0 bg-black/70 backdrop-blur-[6px]" />

        <div className="absolute left-0 right-0 top-0 px-4 pt-5">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl text-white/75 transition hover:border-[#e5e5e5]/45 hover:bg-white/10"
              aria-label="Go back"
            >
              {"<"}
            </button>
            <ProfileReviewLogo href="/" />
            <div className="w-10" />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-4xl items-center justify-center px-4 py-10">
          <div className="dpai-panel w-full max-w-[760px] px-6 py-7 sm:px-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-xl font-semibold uppercase leading-none tracking-tight text-white sm:text-xl">
                  Unlock your full report & action plan
                </h1>
                <p className="mt-3 text-base text-white/60">
                  You're just a step away from meeting your dream partner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/dating-profile-review/quiz?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(accessToken)}&step=23`)}
                className="text-xl text-white/40 transition hover:text-white/70"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="mt-6 space-y-3 text-lg text-white/88">
              {[
                "Unlimited feedback on your photos",
                "Real examples of the best-performing pics",
                "Expert help to write the perfect bio",
                "Over 200 actionable lessons",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-lg">
              <div className="flex items-center justify-between text-white/70">
                <span>Due Mar 7, 2026</span>
                <span>$29</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-white">
                <span>Due today</span>
                <span>${unlockPriceUsd.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {!isLoaded ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/55">
                  Loading authentication state...
                </div>
              ) : userId ? (
                <>
                  <div className="rounded-lg border border-white/10 bg-[#151515] px-4 py-4 text-sm text-white/70">
                    {attaching
                      ? "Linking this preview session to your account..."
                      : attached
                        ? "Your account is linked. Continue to checkout to unlock the full report."
                        : "Your account is ready. Continue to checkout to unlock the full report."}
                  </div>
                  <ProfileReviewPrimaryButton
                    onClick={() => {
                      router.push(
                        `/dating-profile-review/checkout/${sessionId}?accessToken=${encodeURIComponent(accessToken)}`
                      );
                    }}
                    disabled={attaching}
                  >
                    Start 7-day trial
                  </ProfileReviewPrimaryButton>
                </>
              ) : (
                <>
                  <Link
                    href={`/sign-up?redirect_url=${encodeURIComponent(redirectTarget)}`}
                    className={classes(
                      "inline-flex min-h-[56px] w-full items-center justify-center rounded-lg bg-[#d4d4d8] px-6 text-base font-semibold uppercase tracking-[0.06em] text-[#111111] transition",
                      "hover:bg-[#f1f1f1]"
                    )}
                  >
                    Register to continue
                  </Link>
                  <Link
                    href={`/sign-in?redirect_url=${encodeURIComponent(redirectTarget)}`}
                    className={classes(
                      "inline-flex min-h-[56px] w-full items-center justify-center rounded-lg border border-white/18 bg-transparent px-6 text-base font-bold uppercase tracking-[0.05em] text-white transition",
                      "hover:border-[#d4d4d8]/60 hover:bg-white/5"
                    )}
                  >
                    I already have an account
                  </Link>
                </>
              )}

              <p className="text-center text-base text-white/55">
                No commitment, cancel anytime
              </p>

              <ProfileReviewSecondaryButton
                onClick={() => {
                  router.push(
                    `/dating-profile-review/quiz?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(accessToken)}&step=23`
                  );
                }}
              >
                Back to preview score
              </ProfileReviewSecondaryButton>
            </div>

            {attachError ? (
              <p className="mt-4 text-sm text-[#ff7b7b]">{attachError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
