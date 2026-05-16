export const PROFILE_REVIEW_SCORE_MAX = 100;

export const PROFILE_REVIEW_DIMENSION_MAX = {
  firstPhotoImpact: 20,
  trustAndAuthenticity: 16,
  appearancePresentation: 16,
  photoTechnique: 16,
  lifestyleSignals: 12,
  varietyAndBalance: 8,
  goalFit: 12,
} as const;

export function clampScore(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function createScoreRandomizer() {
  return () => Math.random();
}

export function applyScoreVariation(
  value: number,
  max: number,
  randomizer: () => number,
  radius = 3
) {
  const safeRadius = Math.max(0, Math.floor(radius));
  const delta = Math.floor(randomizer() * (safeRadius * 2 + 1)) - safeRadius;
  return clampScore(value + delta, 0, max);
}
