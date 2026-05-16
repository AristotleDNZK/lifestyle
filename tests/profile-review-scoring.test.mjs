import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("profile review scoring defaults to a 100 point scale", () => {
  const config = source("lib/profile-review/config.ts");
  const env = source("lib/env.ts");
  const prompt = source("lib/profile-review/prompt.ts");
  const report = source("app/dating-profile-review/_components/profile-review-report.tsx");
  const landing = source("app/dating-profile-review/page.tsx");
  const scoring = source("lib/profile-review/scoring.ts");

  assert.match(scoring, /PROFILE_REVIEW_SCORE_MAX = 100/);
  assert.match(config, /PROFILE_REVIEW_SCORE_MAX,\s*PROFILE_REVIEW_SCORE_MAX\)/);
  assert.match(env, /PROFILE_REVIEW_SCORE_MAX: process\.env\.PROFILE_REVIEW_SCORE_MAX \|\| "100"/);
  assert.match(prompt, /score this image on a strict 0-\$\{params\.scoreMax\} scale/);
  assert.match(prompt, /firstPhotoImpact: 0-20/);
  assert.match(prompt, /trustAndAuthenticity: 0-16/);
  assert.match(prompt, /appearancePresentation: 0-16/);
  assert.match(prompt, /photoTechnique: 0-16/);
  assert.match(prompt, /lifestyleSignals: 0-12/);
  assert.match(prompt, /varietyAndBalance: 0-8/);
  assert.match(prompt, /goalFit: 0-12/);
  assert.match(report, /const PROFILE_REVIEW_SCORE_MAX = 100;/);
  assert.doesNotMatch(report, /\}\/50|\/ 50|capped at 50/);
  assert.doesNotMatch(landing, /capped at 50|exceed 50/);
});

test("profile review scores include bounded local variation instead of fixed mock scores", () => {
  const localStore = source("lib/profile-review/local-dev-store.ts");
  const gemini = source("lib/profile-review/gemini.ts");

  assert.match(localStore, /createScoreRandomizer/);
  assert.match(localStore, /applyScoreVariation/);
  assert.doesNotMatch(localStore, /overallScore: 34/);
  assert.doesNotMatch(localStore, /analysis_score: Math\.max\(28, 39 - index\)/);

  assert.match(gemini, /applyScoreVariation/);
  assert.match(gemini, /variationSeed/);
  assert.match(gemini, /profileReviewConfig\.scoreMax/);
});
