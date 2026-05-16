"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ProfileReviewReport,
  type ProfileReviewReportImage,
} from "@/app/dating-profile-review/_components/profile-review-report";
import type { ProfileReviewFullReport } from "@/lib/profile-review/types";
import { ProfileReviewLogo } from "@/app/dating-profile-review/_components/profile-review-shell";

type FullReportResponse = {
  report: ProfileReviewFullReport;
  images: Array<{
    id: string;
    sort_order: number;
    file_name?: string | null;
    analysis_score?: number | null;
    signedUrl: string;
  }>;
};

type AppAuthSession = {
  isSignedIn: boolean;
  userId: string | null;
  email: string;
  isLocalDev: boolean;
  localDevAuthEnabled: boolean;
};

function normalizeImages(
  images: FullReportResponse["images"]
): ProfileReviewReportImage[] {
  return images.map((image) => ({
    id: image.id,
    signedUrl: image.signedUrl,
    sortOrder: image.sort_order,
    fileName: image.file_name,
    analysisScore: image.analysis_score,
  }));
}

export default function DatingProfileReviewReportPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const { isLoaded, userId } = useAuth();
  const [appAuth, setAppAuth] = useState<AppAuthSession | null>(null);
  const [report, setReport] = useState<ProfileReviewFullReport | null>(null);
  const [images, setImages] = useState<ProfileReviewReportImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = searchParams.get("accessToken") || searchParams.get("token") || "";
  const emailSent = searchParams.get("emailSent") === "1";
  const email = searchParams.get("email") || "";
  const effectiveUserId = userId || appAuth?.userId || null;
  const authLoaded = isLoaded && appAuth !== null;
  const reportRedirect = `/dating-profile-review/report/${params.sessionId}${accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : ""}`;
  const localLoginHref = `/api/dev-login?redirect=${encodeURIComponent(reportRedirect)}`;

  useEffect(() => {
    let cancelled = false;

    async function loadAppAuth() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await response.json()) as AppAuthSession;

        if (!cancelled) {
          setAppAuth(data);
        }
      } catch {
        if (!cancelled) {
          setAppAuth({
            isSignedIn: false,
            userId: null,
            email: "",
            isLocalDev: false,
            localDevAuthEnabled: false,
          });
        }
      }
    }

    void loadAppAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({ scope: "full" });
        if (accessToken) {
          query.set("accessToken", accessToken);
        }

        const response = await fetch(
          `/api/profile-review/session/${params.sessionId}/report?${query.toString()}`,
          { cache: "no-store" }
        );

        const data = (await response.json()) as FullReportResponse | { error?: string };
        if (!response.ok) {
          throw new Error(
            typeof (data as { error?: string }).error === "string"
              ? (data as { error?: string }).error
              : "Failed to load report"
          );
        }

        if (!cancelled) {
          setReport((data as FullReportResponse).report);
          setImages(normalizeImages((data as FullReportResponse).images));
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [accessToken, params.sessionId]);

  if (loading || !authLoaded) {
    return (
      <main className="dpai-page dpai-grid-bg flex min-h-screen items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#d4d4d8]" />
          <p className="mt-5 text-sm uppercase tracking-[0.14em] text-white/45">
            Loading full report
          </p>
        </div>
      </main>
    );
  }

  if (!effectiveUserId) {
    return (
      <main className="dpai-page dpai-grid-bg flex min-h-screen items-center justify-center px-4 text-white">
        <div className="dpai-panel w-full max-w-xl p-8 text-center">
          <ProfileReviewLogo href="/" />
          <h1 className="mt-6 text-xl font-semibold uppercase tracking-tight">
            Sign in to view your unlocked report
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            This route only unlocks for the paid account owner.
          </p>
          <Link
            href={appAuth?.localDevAuthEnabled ? localLoginHref : `/sign-in?redirect_url=${encodeURIComponent(reportRedirect)}`}
            className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-lg bg-[#d4d4d8] px-6 text-base font-semibold uppercase tracking-[0.06em] text-[#111111]"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="dpai-page dpai-grid-bg flex min-h-screen items-center justify-center px-4 text-white">
        <div className="dpai-panel w-full max-w-2xl p-8 text-center">
          <ProfileReviewLogo href="/" />
          <h1 className="mt-6 text-xl font-semibold uppercase tracking-tight">
            Full report locked
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            {error || "The report is not available yet."}
          </p>
          <div className="mt-8 grid gap-3">
            <Link
              href={`/dating-profile-review/unlock/${params.sessionId}${accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : ""}`}
              className="inline-flex min-h-[56px] items-center justify-center rounded-lg bg-[#d4d4d8] px-6 text-base font-semibold uppercase tracking-[0.06em] text-[#111111]"
            >
              Go to unlock page
            </Link>
            <Link
              href={`/dating-profile-review/quiz?sessionId=${encodeURIComponent(params.sessionId)}${accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : ""}&step=23`}
              className="inline-flex min-h-[56px] items-center justify-center rounded-lg border border-white/18 px-6 text-base font-bold uppercase tracking-[0.05em] text-white"
            >
              Back to preview
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dpai-page dpai-grid-bg">
      {emailSent || email ? (
        <div className="border-b border-[#203124] bg-[#0a0f0c] px-4 py-4 text-white sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
                Report unlocked
              </div>
              <div className="mt-1 text-sm text-white/62">
                {emailSent
                  ? `A copy of the full report has been sent to ${email || "your email"}.`
                  : `The report is unlocked on-site${email ? ` and associated with ${email}` : ""}.`}
              </div>
            </div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.1em] text-white/55 transition hover:text-[#d4d4d8]"
            >
              Back home
            </Link>
          </div>
        </div>
      ) : null}

      <ProfileReviewReport variant="full" report={report} images={images} />
    </main>
  );
}
