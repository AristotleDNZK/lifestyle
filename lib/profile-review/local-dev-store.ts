import { randomUUID } from "crypto";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth-shared";
import type {
  ProfileReviewFullReport,
  ProfileReviewPreviewReport,
} from "@/lib/profile-review/types";
import {
  PROFILE_REVIEW_DIMENSION_MAX,
  PROFILE_REVIEW_SCORE_MAX,
  applyScoreVariation,
  createScoreRandomizer,
} from "@/lib/profile-review/scoring";

export const LOCAL_DEV_PROFILE_REVIEW_SESSION_PREFIX = "local-pr-";

type LocalAnswer = {
  id: string;
  step_key: string;
  question: string;
  answer_value: string;
  answer_label: string;
  raw_payload: Record<string, unknown>;
};

type LocalImage = {
  id: string;
  signedUrl: string;
  sort_order: number;
  file_name: string | null;
  analysis_score: number | null;
};

type LocalSession = {
  id: string;
  access_token: string;
  current_step: number;
  status: string;
  preview_score: number | null;
  email: string | null;
  user_id: string | null;
  paid: boolean;
  answers: LocalAnswer[];
  images: LocalImage[];
  previewReport: ProfileReviewPreviewReport | null;
  fullReport: ProfileReviewFullReport | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __datingPhotosAiProfileReviewSessions:
    | Map<string, LocalSession>
    | undefined;
}

function getLocalSessionMap() {
  if (!globalThis.__datingPhotosAiProfileReviewSessions) {
    globalThis.__datingPhotosAiProfileReviewSessions = new Map();
  }

  return globalThis.__datingPhotosAiProfileReviewSessions;
}

export function isLocalProfileReviewSession(sessionId: string) {
  return (
    isLocalDevAuthEnabled() &&
    sessionId.startsWith(LOCAL_DEV_PROFILE_REVIEW_SESSION_PREFIX)
  );
}

export function createLocalProfileReviewSession() {
  const id = `${LOCAL_DEV_PROFILE_REVIEW_SESSION_PREFIX}${randomUUID()}`;
  const session: LocalSession = {
    id,
    access_token: randomUUID(),
    current_step: 1,
    status: "in_progress",
    preview_score: null,
    email: null,
    user_id: null,
    paid: false,
    answers: [],
    images: [],
    previewReport: null,
    fullReport: null,
  };
  getLocalSessionMap().set(id, session);
  return session;
}

export function getLocalProfileReviewSession(sessionId: string) {
  return getLocalSessionMap().get(sessionId) || null;
}

export function requireLocalProfileReviewAccess(params: {
  sessionId: string;
  accessToken?: string | null;
}) {
  const session = getLocalProfileReviewSession(params.sessionId);
  if (!session) {
    return null;
  }

  if (params.accessToken && params.accessToken !== session.access_token) {
    return null;
  }

  return session;
}

export function saveLocalProfileReviewAnswer(params: {
  sessionId: string;
  stepKey: string;
  question: string;
  answerValue: string;
  answerLabel: string;
  rawPayload?: Record<string, unknown>;
  currentStep?: number;
}) {
  const session = getLocalProfileReviewSession(params.sessionId);
  if (!session) return null;

  const nextAnswer: LocalAnswer = {
    id: `${params.sessionId}-${params.stepKey}`,
    step_key: params.stepKey,
    question: params.question,
    answer_value: params.answerValue,
    answer_label: params.answerLabel,
    raw_payload: params.rawPayload || {},
  };

  session.answers = [
    ...session.answers.filter((answer) => answer.step_key !== params.stepKey),
    nextAnswer,
  ];

  if (
    typeof params.currentStep === "number" &&
    params.currentStep > session.current_step
  ) {
    session.current_step = params.currentStep;
  }

  if (params.stepKey === "report_email") {
    session.email = params.answerValue;
  }

  return nextAnswer;
}

export function attachLocalProfileReviewSessionToUser(params: {
  sessionId: string;
  userId: string;
  email: string;
  accessToken?: string | null;
}) {
  const session = requireLocalProfileReviewAccess({
    sessionId: params.sessionId,
    accessToken: params.accessToken,
  });

  if (!session) {
    return null;
  }

  session.user_id = params.userId;
  session.email = params.email || session.email;
  return session;
}

export function markLocalProfileReviewSessionPaid(params: {
  sessionId: string;
  userId: string;
  email: string;
  accessToken?: string | null;
}) {
  const session = attachLocalProfileReviewSessionToUser(params);

  if (!session || !session.previewReport || !session.fullReport) {
    return null;
  }

  session.paid = true;
  session.status = "paid";
  return session;
}

export function buildLocalPreviewReport(
  images: LocalImage[]
): {
  previewReport: ProfileReviewPreviewReport;
  fullReport: ProfileReviewFullReport;
} {
  const variationSeed = createScoreRandomizer();
  const bestPhotoId = images[0]?.id || null;
  const worstPhotoId = images[images.length - 1]?.id || bestPhotoId;
  const dimensionScores = {
    firstPhotoImpact: applyScoreVariation(
      12,
      PROFILE_REVIEW_DIMENSION_MAX.firstPhotoImpact,
      variationSeed
    ),
    trustAndAuthenticity: applyScoreVariation(
      11,
      PROFILE_REVIEW_DIMENSION_MAX.trustAndAuthenticity,
      variationSeed
    ),
    appearancePresentation: applyScoreVariation(
      10,
      PROFILE_REVIEW_DIMENSION_MAX.appearancePresentation,
      variationSeed
    ),
    photoTechnique: applyScoreVariation(
      9,
      PROFILE_REVIEW_DIMENSION_MAX.photoTechnique,
      variationSeed
    ),
    lifestyleSignals: applyScoreVariation(
      8,
      PROFILE_REVIEW_DIMENSION_MAX.lifestyleSignals,
      variationSeed
    ),
    varietyAndBalance: applyScoreVariation(
      5,
      PROFILE_REVIEW_DIMENSION_MAX.varietyAndBalance,
      variationSeed
    ),
    goalFit: applyScoreVariation(
      8,
      PROFILE_REVIEW_DIMENSION_MAX.goalFit,
      variationSeed
    ),
  };
  const overallScore = Math.min(
    PROFILE_REVIEW_SCORE_MAX,
    Object.values(dimensionScores).reduce((sum, value) => sum + value, 0)
  );

  const previewReport: ProfileReviewPreviewReport = {
    overallScore,
    scoreLabel: "Needs stronger profile photos",
    scoreSummary:
      "Your profile has a workable base, but the first impression needs clearer lighting, stronger variety, and more intentional lifestyle signals.",
    topIssues: [
      "First-photo impact is not strong enough for fast swiping decisions.",
      "The set needs more variety across setting, framing, and expression.",
      "Some photos need clearer lighting and cleaner composition.",
    ],
    quickWins: [
      {
        title: "Lead with your clearest face photo",
        reason: "The first photo carries most of the swipe decision.",
        action: "Use a sharp head-and-shoulders shot with direct eye contact.",
      },
      {
        title: "Add one lifestyle context shot",
        reason: "Context helps matches understand your personality faster.",
        action: "Use a natural outdoor, cafe, or social setting photo.",
      },
    ],
    bestPhotoId,
    worstPhotoId,
    paywallTeaser:
      "Unlock the full report for exact ordering, retake instructions, and profile-level action steps.",
  };

  const fullReport: ProfileReviewFullReport = {
    ...previewReport,
    dimensionScores,
    profileSummary: previewReport.scoreSummary,
    recommendedOrder: images.map((image) => image.id),
    photosToDelete: worstPhotoId ? [worstPhotoId] : [],
    photosToRetake: worstPhotoId ? [worstPhotoId] : [],
    photoReviews: images.map((image, index) => ({
      imageId: image.id,
      sortOrder: index + 1,
      quickLabel: index === 0 ? "Best starter" : "Needs refinement",
      strengths: ["Clear enough to evaluate", "Usable as a profile input"],
      weaknesses: ["Needs stronger composition", "Could signal more lifestyle context"],
      firstImpression: "Approachable, but the profile set can work harder.",
      clarityNotes: ["Improve lighting", "Keep the background cleaner"],
      retakeBlueprint: ["Shoot in daylight", "Use chest-up framing", "Keep expression relaxed"],
      keepOrDrop: index === 0 ? "keep" : "retake",
      idealSlotInProfile: index + 1,
      imageScore: image.analysis_score || overallScore,
    })),
    fullActionPlan: [
      {
        priority: "high",
        title: "Replace weak first-photo options",
        rationale: "A stronger lead photo improves every downstream interaction.",
        action: "Create one clear portrait and one lifestyle shot before testing.",
        successMetric: "First photo should score above 80/100.",
      },
    ],
    sevenDayActionPlan: [
      {
        priority: "high",
        title: "Reshoot the weakest image",
        rationale: "Removing the weakest photo raises the perceived average quality.",
        action: "Use the retake blueprint for one new image this week.",
        successMetric: "Replace at least one low-context photo.",
      },
    ],
    bioSuggestions: [
      "Keep the bio specific and grounded in a real activity.",
      "Use one concrete detail that invites an easy reply.",
    ],
    promptSuggestions: [
      "Create a confident outdoor dating profile portrait with natural light.",
      "Create a candid cafe lifestyle dating photo with clean composition.",
    ],
    confidenceNotes: [
      "The current profile is fixable with better ordering and two stronger shots.",
    ],
  };

  return { previewReport, fullReport };
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function completeLocalProfileReviewUpload(params: {
  sessionId: string;
  files: File[];
}) {
  const session = getLocalProfileReviewSession(params.sessionId);
  if (!session) return null;

  const images: LocalImage[] = [];
  for (const [index, file] of params.files.slice(0, 9).entries()) {
    const dataUrl = await fileToDataUrl(file);
    images.push({
      id: `${params.sessionId}-image-${index + 1}`,
      signedUrl: dataUrl,
      sort_order: index + 1,
      file_name: file.name,
      analysis_score: applyScoreVariation(
        Math.max(56, 78 - index * 3),
        PROFILE_REVIEW_SCORE_MAX,
        createScoreRandomizer(),
        5
      ),
    });
  }

  const { previewReport, fullReport } = buildLocalPreviewReport(images);
  session.images = images;
  session.previewReport = previewReport;
  session.fullReport = fullReport;
  session.preview_score = previewReport.overallScore;
  session.status = "analyzed";
  session.current_step = 21;
  return session;
}
