"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PROFILE_REVIEW_SESSION_STORAGE_KEY,
  resolveProfileReviewEntry,
  shouldSkipProfileReviewReinitialization,
  type StoredProfileReviewSession,
} from "@/lib/profile-review/client-entry";
import { getProfileReviewStep, profileReviewSteps } from "@/lib/profile-review/steps";
import type {
  ProfileReviewPreviewReport,
  StepOption,
} from "@/lib/profile-review/types";
import { ProfileReviewStepRenderer } from "@/app/dating-profile-review/_components/profile-review-step-renderer";
import type { ProfileReviewReportImage } from "@/app/dating-profile-review/_components/profile-review-report";

type SessionResponse = {
  sessionId: string;
  accessToken: string;
  currentStep: number;
  status: string;
};

type StatusResponse = {
  sessionId: string;
  status: string;
  currentStep: number;
  previewScore?: number | null;
  reportReady: boolean;
  isUnlocked: boolean;
};

type PreviewReportResponse = {
  report: ProfileReviewPreviewReport;
  images: Array<{
    id: string;
    sort_order: number;
    file_name?: string | null;
    analysis_score?: number | null;
    signedUrl: string;
  }>;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
};

function clampStep(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(
    Math.max(value, 1),
    profileReviewSteps[profileReviewSteps.length - 1]?.id || 23
  );
}

function buildQuizUrl(sessionId: string, accessToken: string, step: number) {
  const params = new URLSearchParams({
    sessionId,
    accessToken,
    step: String(clampStep(step)),
  });

  return `/dating-profile-review/quiz?${params.toString()}`;
}

function buildHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    "x-profile-review-token": accessToken,
  };
}

function normalizePreviewImages(
  images: PreviewReportResponse["images"]
): ProfileReviewReportImage[] {
  return images.map((image) => ({
    id: image.id,
    signedUrl: image.signedUrl,
    sortOrder: image.sort_order,
    fileName: image.file_name,
    analysisScore: image.analysis_score,
  }));
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PROFILE_REVIEW_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredProfileReviewSession;
  } catch {
    window.localStorage.removeItem(PROFILE_REVIEW_SESSION_STORAGE_KEY);
    return null;
  }
}

function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PROFILE_REVIEW_SESSION_STORAGE_KEY);
}

export function ProfileReviewQuizClient({
  unlockPriceUsd,
}: {
  unlockPriceUsd: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [emailValue, setEmailValue] = useState("");
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [previewReport, setPreviewReport] =
    useState<ProfileReviewPreviewReport | null>(null);
  const [previewImages, setPreviewImages] = useState<ProfileReviewReportImage[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(8);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);
  const uploadItemsRef = useRef<UploadItem[]>([]);
  const activeSessionRef = useRef<StoredProfileReviewSession | null>(null);

  const step = useMemo(() => getProfileReviewStep(currentStep), [currentStep]);

  const syncLocation = useCallback(
    (nextSessionId: string, nextAccessToken: string, nextStep: number) => {
      if (!nextSessionId || !nextAccessToken) {
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PROFILE_REVIEW_SESSION_STORAGE_KEY,
          JSON.stringify({ sessionId: nextSessionId, accessToken: nextAccessToken })
        );
        window.history.replaceState(
          null,
          "",
          buildQuizUrl(nextSessionId, nextAccessToken, nextStep)
        );
      }
    },
    []
  );

  const goToStep = useCallback(
    (nextStep: number) => {
      const safeStep = clampStep(nextStep);
      setCurrentStep(safeStep);

      if (sessionId && accessToken) {
        syncLocation(sessionId, accessToken, safeStep);
      }
    },
    [accessToken, sessionId, syncLocation]
  );

  const loadPreviewReport = useCallback(
    async (nextSessionId: string, nextAccessToken: string) => {
      const response = await fetch(
        `/api/profile-review/session/${nextSessionId}/report?scope=preview&accessToken=${encodeURIComponent(nextAccessToken)}`,
        { cache: "no-store" }
      );

      const data = (await response.json()) as
        | PreviewReportResponse
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to load preview report"
        );
      }

      setPreviewReport((data as PreviewReportResponse).report);
      setPreviewImages(normalizePreviewImages((data as PreviewReportResponse).images));
    },
    []
  );

  const loadStatus = useCallback(
    async (nextSessionId: string, nextAccessToken: string) => {
      const response = await fetch(
        `/api/profile-review/session/${nextSessionId}/status?accessToken=${encodeURIComponent(nextAccessToken)}`,
        { cache: "no-store" }
      );

      const data = (await response.json()) as StatusResponse | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to load review status"
        );
      }

      return data as StatusResponse;
    },
    []
  );

  const createSession = useCallback(async () => {
    const response = await fetch("/api/profile-review/session", {
      method: "POST",
      cache: "no-store",
    });

    const data = (await response.json()) as SessionResponse | { error?: string };
    if (!response.ok) {
      throw new Error(
        "error" in data && typeof data.error === "string"
          ? data.error
          : "Failed to create profile review session"
      );
    }

    return data as SessionResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const stored = readStoredSession();
      const resolvedEntry = resolveProfileReviewEntry({
        searchParams,
        storedSession: stored,
      });

      if (
        shouldSkipProfileReviewReinitialization({
          activeSession: activeSessionRef.current,
          resolvedEntry,
        })
      ) {
        return;
      }

      try {
        setInitializing(true);
        setError(null);

        if (resolvedEntry.shouldClearStoredSession) {
          clearStoredSession();
        }

        let activeSessionId = resolvedEntry.sessionId;
        let activeAccessToken = resolvedEntry.accessToken;
        let activeStep = resolvedEntry.requestedStep;

        if (resolvedEntry.shouldCreateSession) {
          const created = await createSession();
          activeSessionId = created.sessionId;
          activeAccessToken = created.accessToken;
          activeStep = created.currentStep;
        } else {
          const status = await loadStatus(activeSessionId, activeAccessToken);
          activeStep = searchParams.get("step")
            ? resolvedEntry.requestedStep
            : clampStep(status.currentStep);
          if (status.reportReady && activeStep >= 23) {
            await loadPreviewReport(activeSessionId, activeAccessToken);
          }
        }

        if (cancelled) {
          return;
        }

        setSessionId(activeSessionId);
        setAccessToken(activeAccessToken);
        setCurrentStep(activeStep);
        activeSessionRef.current = {
          sessionId: activeSessionId,
          accessToken: activeAccessToken,
        };
        syncLocation(activeSessionId, activeAccessToken, activeStep);
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to initialize the review"
          );
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [createSession, loadPreviewReport, loadStatus, searchParams, syncLocation]);

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
      uploadItemsRef.current.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl)
      );
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !accessToken || currentStep !== 20) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setError(null);
    setAnalysisProgress((value) => Math.max(value, 12));

    const poll = async () => {
      try {
        const status = await loadStatus(sessionId, accessToken);
        if (cancelled) {
          return;
        }

        if (status.status === "failed") {
          setError("The analysis failed. Please go back, adjust your uploads, and try again.");
          return;
        }

        setAnalysisProgress((value) => Math.min(value + 7, 94));

        if (status.reportReady) {
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setAnalysisProgress(100);
          await loadPreviewReport(sessionId, accessToken);
          goToStep(21);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Failed while checking analysis status"
          );
        }
      }
    };

    void poll();
    pollingRef.current = window.setInterval(() => {
      void poll();
    }, 2400);

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [accessToken, currentStep, goToStep, loadPreviewReport, loadStatus, sessionId]);

  useEffect(() => {
    if (currentStep >= 23 && sessionId && accessToken && !previewReport) {
      void loadPreviewReport(sessionId, accessToken).catch((nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to load preview report"
        );
      });
    }
  }, [accessToken, currentStep, loadPreviewReport, previewReport, sessionId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const saveAnswer = useCallback(
    async (payload: {
      stepKey: string;
      question: string;
      answerValue: string;
      answerLabel: string;
      rawPayload?: Record<string, unknown>;
      currentStep: number;
    }) => {
      if (!sessionId || !accessToken) {
        throw new Error("Missing active profile review session");
      }

      const response = await fetch(`/api/profile-review/session/${sessionId}/answer`, {
        method: "POST",
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to save answer"
        );
      }
    },
    [accessToken, sessionId]
  );

  const handleChoice = useCallback(
    async (option: StepOption) => {
      if (step.type !== "choice") {
        return;
      }

      try {
        setBusy(true);
        setError(null);
        await saveAnswer({
          stepKey: step.key,
          question: step.question,
          answerValue: option.value,
          answerLabel: option.label,
          rawPayload: { stepId: step.id },
          currentStep: step.id + 1,
        });
        goToStep(step.id + 1);
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Failed to save answer"
        );
      } finally {
        setBusy(false);
      }
    },
    [goToStep, saveAnswer, step]
  );

  const handleContinue = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);

      if (step.type === "message") {
        await saveAnswer({
          stepKey: step.key,
          question: step.title,
          answerValue: "continue",
          answerLabel: step.cta,
          rawPayload: { stepId: step.id },
          currentStep: step.id + 1,
        });
        goToStep(step.id + 1);
        return;
      }

      if (step.type === "email") {
        const normalizedEmail = emailValue.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          throw new Error("Please enter a valid email address");
        }

        await saveAnswer({
          stepKey: step.key,
          question: step.title,
          answerValue: normalizedEmail,
          answerLabel: normalizedEmail,
          rawPayload: { stepId: step.id },
          currentStep: step.id + 1,
        });
        goToStep(step.id + 1);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to continue");
    } finally {
      setBusy(false);
    }
  }, [emailValue, goToStep, saveAnswer, step]);

  const handleUploadIntroChoice = useCallback(
    async (source: "upload" | "tinder" | "instagram") => {
      if (step.type !== "upload-intro") {
        return;
      }

      const labelMap = {
        upload: "Upload photos",
        tinder: "Import from Tinder",
        instagram: "Import from Instagram",
      } as const;

      try {
        setBusy(true);
        setError(null);
        await saveAnswer({
          stepKey: step.key,
          question: step.title,
          answerValue: source,
          answerLabel: labelMap[source],
          rawPayload: { stepId: step.id, source },
          currentStep: step.id + 1,
        });
        goToStep(step.id + 1);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to continue");
      } finally {
        setBusy(false);
      }
    },
    [goToStep, saveAnswer, step]
  );

  const handleUpsellChoice = useCallback(
    async (accepted: boolean) => {
      if (step.type !== "upsell") {
        return;
      }

      try {
        setBusy(true);
        setError(null);
        await saveAnswer({
          stepKey: step.key,
          question: step.title,
          answerValue: accepted ? "accepted" : "declined",
          answerLabel: accepted ? step.acceptLabel : step.declineLabel,
          rawPayload: { stepId: step.id, accepted },
          currentStep: step.id + 1,
        });
        await loadPreviewReport(sessionId, accessToken);
        goToStep(step.id + 1);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to continue");
      } finally {
        setBusy(false);
      }
    },
    [accessToken, goToStep, loadPreviewReport, saveAnswer, sessionId, step]
  );

  const handleUploadFiles = useCallback((files: FileList | null) => {
    if (!files) {
      return;
    }

    setError(null);
    setUploadItems((current) => {
      const next = [...current];
      Array.from(files)
        .slice(0, 9)
        .forEach((file) => {
          if (next.length >= 9) {
            return;
          }

          next.push({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            file,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
          });
        });

      return next;
    });
  }, []);

  const handleRemoveUpload = useCallback((id: string) => {
    setUploadItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const handleSubmitUploads = useCallback(async () => {
    if (!sessionId || !accessToken) {
      setError("Missing upload session");
      return;
    }

    if (!uploadItems.length) {
      setError("Please upload at least one photo");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const formData = new FormData();
      uploadItems.forEach((item) => {
        formData.append("files", item.file);
      });

      const response = await fetch(`/api/profile-review/session/${sessionId}/upload`, {
        method: "POST",
        headers: {
          "x-profile-review-token": accessToken,
        },
        body: formData,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to upload photos"
        );
      }

      setAnalysisProgress(12);
      goToStep(20);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to upload photos"
      );
    } finally {
      setBusy(false);
    }
  }, [accessToken, goToStep, sessionId, uploadItems]);

  const handleUnlockReport = useCallback(() => {
    if (!sessionId || !accessToken) {
      setError("Missing review session");
      return;
    }

    router.push(
      `/dating-profile-review/unlock/${sessionId}?accessToken=${encodeURIComponent(accessToken)}`
    );
  }, [accessToken, router, sessionId]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#63f276]" />
          <p className="mt-5 text-sm uppercase tracking-[0.14em] text-white/45">
            Initializing review flow
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProfileReviewStepRenderer
      step={step}
      canGoBack={currentStep > 1 && currentStep < 20}
      onBack={handleBack}
      busy={busy}
      emailValue={emailValue}
      onEmailChange={setEmailValue}
      onChoice={(option) => {
        void handleChoice(option);
      }}
      onContinue={() => {
        void handleContinue();
      }}
      onUpsellChoice={(accepted) => {
        void handleUpsellChoice(accepted);
      }}
      onUploadIntroChoice={(source) => {
        void handleUploadIntroChoice(source);
      }}
      uploadPreviews={uploadItems}
      onUploadFiles={handleUploadFiles}
      onRemoveUpload={handleRemoveUpload}
      onSubmitUploads={() => {
        void handleSubmitUploads();
      }}
      analysisProgress={analysisProgress}
      previewReport={previewReport}
      previewImages={previewImages}
      onUnlockReport={handleUnlockReport}
      unlockPriceUsd={unlockPriceUsd}
      error={error}
    />
  );
}
