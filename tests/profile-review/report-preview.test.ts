import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

globalThis.React = React;

type ProfileReviewReportModule = typeof import("../../app/dating-profile-review/_components/profile-review-report");

async function renderPreviewReport() {
  const module = (await import(
    "../../app/dating-profile-review/_components/profile-review-report"
  )) as ProfileReviewReportModule;
  const { ProfileReviewReport } = module;

  return renderToStaticMarkup(
    ProfileReviewReport({
      variant: "preview",
      report: {
        overallScore: 23,
        scoreLabel: "Needs work",
        scoreSummary: "Your current profile needs stronger first-impression photos.",
        topIssues: [
          "Weak first photo selection",
          "Inconsistent visual storytelling",
          "Low trust and authenticity signals",
        ],
        quickWins: [],
        bestPhotoId: null,
        worstPhotoId: null,
        paywallTeaser: "Unlock the full report to see the complete action plan.",
      },
      images: [],
      unlockHref: "/dating-profile-review/unlock/test-session?accessToken=test-token",
      unlockPriceUsd: 3.99,
    })
  );
}

test("preview report shows unlock calls-to-action in both the photo and locked full-report sections", async () => {
  const html = await renderPreviewReport();
  const unlockButtons = html.match(/Unlock for \$3\.99/g) || [];

  assert.equal(unlockButtons.length, 2);
});
