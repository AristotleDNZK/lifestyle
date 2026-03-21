export const PROFILE_REVIEW_SESSION_STORAGE_KEY = "profile-review-session";

export type StoredProfileReviewSession = {
  sessionId: string;
  accessToken: string;
};

type SearchParamsLike = {
  get(name: string): string | null;
};

function clampStep(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(Math.floor(value), 1), 23);
}

export function shouldForceFreshProfileReview(searchParams: SearchParamsLike) {
  const fresh = (searchParams.get("fresh") || "").trim().toLowerCase();
  return fresh === "1" || fresh === "true" || fresh === "yes";
}

export function resolveProfileReviewEntry(params: {
  searchParams: SearchParamsLike;
  storedSession: StoredProfileReviewSession | null;
}) {
  const fresh = shouldForceFreshProfileReview(params.searchParams);
  const urlSessionId = (params.searchParams.get("sessionId") || "").trim();
  const urlAccessToken =
    (params.searchParams.get("accessToken") ||
      params.searchParams.get("token") ||
      "").trim();
  const requestedStep = clampStep(Number(params.searchParams.get("step") || "1"));

  if (fresh) {
    return {
      sessionId: "",
      accessToken: "",
      requestedStep: 1,
      shouldCreateSession: true,
      shouldClearStoredSession: true,
    };
  }

  if (urlSessionId && urlAccessToken) {
    return {
      sessionId: urlSessionId,
      accessToken: urlAccessToken,
      requestedStep,
      shouldCreateSession: false,
      shouldClearStoredSession: false,
    };
  }

  if (params.storedSession?.sessionId && params.storedSession?.accessToken) {
    return {
      sessionId: params.storedSession.sessionId,
      accessToken: params.storedSession.accessToken,
      requestedStep,
      shouldCreateSession: false,
      shouldClearStoredSession: false,
    };
  }

  return {
    sessionId: "",
    accessToken: "",
    requestedStep: 1,
    shouldCreateSession: true,
    shouldClearStoredSession: false,
  };
}

export function shouldSkipProfileReviewReinitialization(params: {
  activeSession: StoredProfileReviewSession | null;
  resolvedEntry: {
    sessionId: string;
    accessToken: string;
    shouldCreateSession: boolean;
  };
}) {
  if (params.resolvedEntry.shouldCreateSession) {
    return false;
  }

  return (
    params.activeSession?.sessionId === params.resolvedEntry.sessionId &&
    params.activeSession?.accessToken === params.resolvedEntry.accessToken
  );
}
