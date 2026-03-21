import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import {
  supabaseAdmin,
  type ProfileReviewAnswer,
  type ProfileReviewImage,
} from "@/lib/supabase";
import {
  profileReviewConfig,
  profileReviewPromptVersion,
  requireGeminiApiKey,
} from "@/lib/profile-review/config";
import {
  buildProfileReviewObservationPrompt,
  buildProfileReviewSummaryPrompt,
} from "@/lib/profile-review/prompt";
import { generateGeminiStructuredJson } from "@/lib/profile-review/gemini-rest";
import type {
  FullActionItem,
  PhotoObservation,
  ProfileReviewFullReport,
  ProfileReviewPreviewReport,
  WeightedScoreBreakdown,
} from "@/lib/profile-review/types";

type ModelImageInput = {
  id: string;
  sortOrder: number;
  mimeType: string;
  base64: string;
};

type RawCombinedReport = {
  scoreLabel?: string;
  scoreSummary?: string;
  paywallTeaser?: string;
  profileSummary?: string;
  topIssues?: string[];
  quickWins?: Array<{
    title?: string;
    reason?: string;
    action?: string;
  }>;
  dimensionScores?: Partial<WeightedScoreBreakdown>;
  recommendedOrder?: string[];
  photosToDelete?: string[];
  photosToRetake?: string[];
  bioSuggestions?: string[];
  promptSuggestions?: string[];
  confidenceNotes?: string[];
  fullActionPlan?: Array<{
    priority?: string;
    title?: string;
    rationale?: string;
    action?: string;
    successMetric?: string;
  }>;
  sevenDayActionPlan?: Array<{
    priority?: string;
    title?: string;
    rationale?: string;
    action?: string;
    successMetric?: string;
  }>;
  photoReviews?: Array<Partial<PhotoObservation>>;
};

const observationSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: [
    "quickLabel",
    "strengths",
    "weaknesses",
    "firstImpression",
    "clarityNotes",
    "retakeBlueprint",
    "keepOrDrop",
    "idealSlotInProfile",
    "imageScore",
  ],
  properties: {
    quickLabel: {
      type: SchemaType.STRING,
      description: "Short label summarizing this image's role or vibe.",
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    firstImpression: { type: SchemaType.STRING },
    clarityNotes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    retakeBlueprint: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    keepOrDrop: { type: SchemaType.STRING },
    idealSlotInProfile: { type: SchemaType.INTEGER },
    imageScore: { type: SchemaType.INTEGER },
  },
};

const combinedReportSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  required: [
    "scoreLabel",
    "scoreSummary",
    "paywallTeaser",
    "profileSummary",
    "topIssues",
    "quickWins",
    "dimensionScores",
    "recommendedOrder",
    "photosToDelete",
    "photosToRetake",
    "bioSuggestions",
    "promptSuggestions",
    "confidenceNotes",
    "fullActionPlan",
    "sevenDayActionPlan",
    "photoReviews",
  ],
  properties: {
    scoreLabel: { type: SchemaType.STRING },
    scoreSummary: { type: SchemaType.STRING },
    paywallTeaser: { type: SchemaType.STRING },
    profileSummary: { type: SchemaType.STRING },
    topIssues: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    quickWins: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["title", "reason", "action"],
        properties: {
          title: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
        },
      },
    },
    dimensionScores: {
      type: SchemaType.OBJECT,
      required: [
        "firstPhotoImpact",
        "trustAndAuthenticity",
        "appearancePresentation",
        "photoTechnique",
        "lifestyleSignals",
        "varietyAndBalance",
        "goalFit",
      ],
      properties: {
        firstPhotoImpact: { type: SchemaType.INTEGER },
        trustAndAuthenticity: { type: SchemaType.INTEGER },
        appearancePresentation: { type: SchemaType.INTEGER },
        photoTechnique: { type: SchemaType.INTEGER },
        lifestyleSignals: { type: SchemaType.INTEGER },
        varietyAndBalance: { type: SchemaType.INTEGER },
        goalFit: { type: SchemaType.INTEGER },
      },
    },
    recommendedOrder: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    photosToDelete: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    photosToRetake: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    bioSuggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    promptSuggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    confidenceNotes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    fullActionPlan: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["priority", "title", "rationale", "action", "successMetric"],
        properties: {
          priority: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          rationale: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
          successMetric: { type: SchemaType.STRING },
        },
      },
    },
    sevenDayActionPlan: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["priority", "title", "rationale", "action", "successMetric"],
        properties: {
          priority: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          rationale: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
          successMetric: { type: SchemaType.STRING },
        },
      },
    },
    photoReviews: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: [
          "imageId",
          "sortOrder",
          "quickLabel",
          "strengths",
          "weaknesses",
          "firstImpression",
          "clarityNotes",
          "retakeBlueprint",
          "keepOrDrop",
          "idealSlotInProfile",
          "imageScore",
        ],
        properties: {
          imageId: { type: SchemaType.STRING },
          sortOrder: { type: SchemaType.INTEGER },
          quickLabel: { type: SchemaType.STRING },
          strengths: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          weaknesses: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          firstImpression: { type: SchemaType.STRING },
          clarityNotes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          retakeBlueprint: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          keepOrDrop: { type: SchemaType.STRING },
          idealSlotInProfile: { type: SchemaType.INTEGER },
          imageScore: { type: SchemaType.INTEGER },
        },
      },
    },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeJsonParse<T>(value: string): T {
  return JSON.parse(value) as T;
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeWeightedScores(
  value: Partial<WeightedScoreBreakdown> | undefined
): WeightedScoreBreakdown {
  return {
    firstPhotoImpact: clamp(Number(value?.firstPhotoImpact ?? 0), 0, 10),
    trustAndAuthenticity: clamp(
      Number(value?.trustAndAuthenticity ?? 0),
      0,
      8
    ),
    appearancePresentation: clamp(
      Number(value?.appearancePresentation ?? 0),
      0,
      8
    ),
    photoTechnique: clamp(Number(value?.photoTechnique ?? 0), 0, 8),
    lifestyleSignals: clamp(Number(value?.lifestyleSignals ?? 0), 0, 6),
    varietyAndBalance: clamp(Number(value?.varietyAndBalance ?? 0), 0, 4),
    goalFit: clamp(Number(value?.goalFit ?? 0), 0, 6),
  };
}

function normalizePriority(value: unknown): FullActionItem["priority"] {
  return value === "low" || value === "medium" ? value : "high";
}

function normalizeActionItems(
  value: RawCombinedReport["fullActionPlan"] | RawCombinedReport["sevenDayActionPlan"]
) {
  if (!Array.isArray(value)) {
    return [] as FullActionItem[];
  }

  return value
    .map((item) => ({
      priority: normalizePriority(item?.priority),
      title: typeof item?.title === "string" ? item.title.trim() : "",
      rationale: typeof item?.rationale === "string" ? item.rationale.trim() : "",
      action: typeof item?.action === "string" ? item.action.trim() : "",
      successMetric:
        typeof item?.successMetric === "string"
          ? item.successMetric.trim()
          : "",
    }))
    .filter(
      (item): item is FullActionItem =>
        Boolean(item.title && item.rationale && item.action && item.successMetric)
    );
}

function totalScore(breakdown: WeightedScoreBreakdown) {
  return (
    breakdown.firstPhotoImpact +
    breakdown.trustAndAuthenticity +
    breakdown.appearancePresentation +
    breakdown.photoTechnique +
    breakdown.lifestyleSignals +
    breakdown.varietyAndBalance +
    breakdown.goalFit
  );
}

function normalizeObservation(
  raw: Partial<PhotoObservation>,
  image: ModelImageInput
): PhotoObservation {
  const keepRaw =
    typeof raw.keepOrDrop === "string" ? raw.keepOrDrop.toLowerCase() : "";
  const keepOrDrop = keepRaw === "drop" || keepRaw === "retake" ? keepRaw : "keep";

  return {
    imageId: image.id,
    sortOrder: image.sortOrder,
    quickLabel:
      typeof raw.quickLabel === "string" && raw.quickLabel.trim()
        ? raw.quickLabel.trim()
        : `Photo ${image.sortOrder}`,
    strengths: normalizeStringArray(raw.strengths, [
      "No major strengths identified.",
    ]),
    weaknesses: normalizeStringArray(raw.weaknesses, [
      "No major weaknesses identified.",
    ]),
    firstImpression:
      typeof raw.firstImpression === "string" && raw.firstImpression.trim()
        ? raw.firstImpression.trim()
        : "Neutral first impression.",
    clarityNotes: normalizeStringArray(raw.clarityNotes),
    retakeBlueprint: normalizeStringArray(raw.retakeBlueprint),
    keepOrDrop,
    idealSlotInProfile:
      raw.idealSlotInProfile == null
        ? null
        : clamp(Number(raw.idealSlotInProfile), 1, 9),
    imageScore: clamp(
      Number(raw.imageScore ?? 0),
      0,
      profileReviewConfig.scoreMax
    ),
  };
}

function normalizeCombinedReport(
  raw: RawCombinedReport,
  fallbackObservations: PhotoObservation[]
): ProfileReviewFullReport {
  const dimensionScores = normalizeWeightedScores(raw.dimensionScores);

  const normalizedPhotoReviews = (Array.isArray(raw.photoReviews)
    ? raw.photoReviews
    : []
  )
    .map((review) => {
      const match = fallbackObservations.find(
        (item) => item.imageId === review.imageId
      );
      if (!match) {
        return null;
      }

      return normalizeObservation(review, {
        id: match.imageId,
        sortOrder: match.sortOrder,
        mimeType: "image/jpeg",
        base64: "",
      });
    })
    .filter(Boolean) as PhotoObservation[];

  const photoReviews = normalizedPhotoReviews.length
    ? normalizedPhotoReviews
    : fallbackObservations;

  return {
    overallScore: clamp(
      totalScore(dimensionScores),
      0,
      profileReviewConfig.scoreMax
    ),
    scoreLabel:
      typeof raw.scoreLabel === "string" && raw.scoreLabel.trim()
        ? raw.scoreLabel.trim()
        : "Needs work",
    scoreSummary:
      typeof raw.scoreSummary === "string" && raw.scoreSummary.trim()
        ? raw.scoreSummary.trim()
        : "Your profile has potential, but several photo issues are suppressing match performance.",
    paywallTeaser:
      typeof raw.paywallTeaser === "string" && raw.paywallTeaser.trim()
        ? raw.paywallTeaser.trim()
        : "Unlock the full report to see exactly which photos to keep, delete, and retake.",
    topIssues: normalizeStringArray(raw.topIssues).slice(0, 5),
    quickWins: Array.isArray(raw.quickWins)
      ? raw.quickWins
          .map((item) => ({
            title: typeof item?.title === "string" ? item.title.trim() : "",
            reason: typeof item?.reason === "string" ? item.reason.trim() : "",
            action: typeof item?.action === "string" ? item.action.trim() : "",
          }))
          .filter((item) => item.title && item.reason && item.action)
      : [],
    bestPhotoId:
      photoReviews.slice().sort((a, b) => b.imageScore - a.imageScore)[0]
        ?.imageId || null,
    worstPhotoId:
      photoReviews.slice().sort((a, b) => a.imageScore - b.imageScore)[0]
        ?.imageId || null,
    dimensionScores,
    profileSummary:
      typeof raw.profileSummary === "string" && raw.profileSummary.trim()
        ? raw.profileSummary.trim()
        : "Your photos are not yet aligned with the outcome you want on dating apps.",
    recommendedOrder: normalizeStringArray(raw.recommendedOrder),
    photosToDelete: normalizeStringArray(raw.photosToDelete),
    photosToRetake: normalizeStringArray(raw.photosToRetake),
    photoReviews,
    fullActionPlan: normalizeActionItems(raw.fullActionPlan),
    sevenDayActionPlan: normalizeActionItems(raw.sevenDayActionPlan),
    bioSuggestions: normalizeStringArray(raw.bioSuggestions),
    promptSuggestions: normalizeStringArray(raw.promptSuggestions),
    confidenceNotes: normalizeStringArray(raw.confidenceNotes),
  };
}

function derivePreviewReport(
  fullReport: ProfileReviewFullReport
): ProfileReviewPreviewReport {
  return {
    overallScore: fullReport.overallScore,
    scoreLabel: fullReport.scoreLabel,
    scoreSummary: fullReport.scoreSummary,
    topIssues: fullReport.topIssues.slice(0, 3),
    quickWins: fullReport.quickWins.slice(0, 3),
    bestPhotoId: fullReport.bestPhotoId,
    worstPhotoId: fullReport.worstPhotoId,
    paywallTeaser: fullReport.paywallTeaser,
  };
}

async function generateStructuredJson(params: {
  modelName: string;
  prompt: string;
  inlineImages: ModelImageInput[];
  schema: ResponseSchema;
}) {
  return generateGeminiStructuredJson({
    apiKey: requireGeminiApiKey(),
    modelName: params.modelName,
    prompt: params.prompt,
    inlineImages: params.inlineImages.map((image) => ({
      mimeType: image.mimeType,
      base64: image.base64,
    })),
    schema: params.schema,
    timeoutMs: profileReviewConfig.timeoutMs,
  });
}

export async function generateProfileReviewReport(params: {
  answers: ProfileReviewAnswer[];
  images: ModelImageInput[];
}) {
  const observations: PhotoObservation[] = [];

  for (const image of params.images) {
    const jsonText = await generateStructuredJson({
      modelName: profileReviewConfig.observationModel,
      prompt: buildProfileReviewObservationPrompt({
        imagePosition: image.sortOrder,
        totalImages: params.images.length,
      }),
      inlineImages: [image],
      schema: observationSchema,
    });

    observations.push(normalizeObservation(safeJsonParse(jsonText), image));
  }

  const combinedText = await generateStructuredJson({
    modelName: profileReviewConfig.reportModel,
    prompt: buildProfileReviewSummaryPrompt({
      answers: params.answers,
      observations,
      scoreMax: profileReviewConfig.scoreMax,
    }),
    inlineImages: params.images,
    schema: combinedReportSchema,
  });

  const normalizedFullReport = normalizeCombinedReport(
    safeJsonParse<RawCombinedReport>(combinedText),
    observations
  );
  const previewReport = derivePreviewReport(normalizedFullReport);

  return {
    modelName: profileReviewConfig.reportModel,
    modelVersion: profileReviewConfig.reportModel,
    promptVersion: profileReviewPromptVersion,
    previewReport,
    fullReport: normalizedFullReport,
    rawModelOutput: {
      observations,
      combined: safeJsonParse<RawCombinedReport>(combinedText),
    },
  } satisfies {
    modelName: string;
    modelVersion: string;
    promptVersion: string;
    previewReport: ProfileReviewPreviewReport;
    fullReport: ProfileReviewFullReport;
    rawModelOutput: Record<string, unknown>;
  };
}

export async function loadImageForGemini(image: ProfileReviewImage) {
  const { data, error } = await supabaseAdmin.storage
    .from(profileReviewConfig.storageBucket)
    .download(image.storage_path);

  if (error || !data) {
    throw new Error(
      `Failed to download review image: ${error?.message || "Unknown error"}`
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    id: image.id,
    sortOrder: image.sort_order,
    mimeType: image.mime_type || "image/jpeg",
    base64: Buffer.from(arrayBuffer).toString("base64"),
  } satisfies ModelImageInput;
}
