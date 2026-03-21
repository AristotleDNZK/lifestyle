export type ProfileReviewSessionStatus =
  | "in_progress"
  | "awaiting_analysis"
  | "analyzed"
  | "paywalled"
  | "paid"
  | "delivered"
  | "failed";

export type ProfileReviewImageAnalysisStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ProfileReviewOrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type ReportDimensionKey =
  | "firstPhotoImpact"
  | "trustAndAuthenticity"
  | "appearancePresentation"
  | "photoTechnique"
  | "lifestyleSignals"
  | "varietyAndBalance"
  | "goalFit";

export interface StepOption {
  value: string;
  label: string;
  icon?: string;
}

export interface WeightedScoreBreakdown {
  firstPhotoImpact: number;
  trustAndAuthenticity: number;
  appearancePresentation: number;
  photoTechnique: number;
  lifestyleSignals: number;
  varietyAndBalance: number;
  goalFit: number;
}

export interface PhotoObservation {
  imageId: string;
  sortOrder: number;
  quickLabel: string;
  strengths: string[];
  weaknesses: string[];
  firstImpression: string;
  clarityNotes: string[];
  retakeBlueprint: string[];
  keepOrDrop: "keep" | "drop" | "retake";
  idealSlotInProfile: number | null;
  imageScore: number;
}

export interface QuickWin {
  title: string;
  reason: string;
  action: string;
}

export interface FullActionItem {
  priority: "high" | "medium" | "low";
  title: string;
  rationale: string;
  action: string;
  successMetric: string;
}

export interface ProfileReviewPreviewReport {
  overallScore: number;
  scoreLabel: string;
  scoreSummary: string;
  topIssues: string[];
  quickWins: QuickWin[];
  bestPhotoId: string | null;
  worstPhotoId: string | null;
  paywallTeaser: string;
}

export interface ProfileReviewFullReport
  extends ProfileReviewPreviewReport {
  dimensionScores: WeightedScoreBreakdown;
  profileSummary: string;
  recommendedOrder: string[];
  photosToDelete: string[];
  photosToRetake: string[];
  photoReviews: PhotoObservation[];
  fullActionPlan: FullActionItem[];
  sevenDayActionPlan: FullActionItem[];
  bioSuggestions: string[];
  promptSuggestions: string[];
  confidenceNotes: string[];
}

export interface ProfileReviewModelOutput {
  previewReport: ProfileReviewPreviewReport;
  fullReport: ProfileReviewFullReport;
}
