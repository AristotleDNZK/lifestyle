import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveProfileReviewEntry,
  shouldSkipProfileReviewReinitialization,
  shouldForceFreshProfileReview,
} from "../../lib/profile-review/client-entry";

test("shouldForceFreshProfileReview returns true for fresh=1", () => {
  const searchParams = new URLSearchParams("fresh=1");

  assert.equal(shouldForceFreshProfileReview(searchParams), true);
});

test("resolveProfileReviewEntry ignores stored session when fresh mode is requested", () => {
  const resolved = resolveProfileReviewEntry({
    searchParams: new URLSearchParams("fresh=1"),
    storedSession: {
      sessionId: "stored-session",
      accessToken: "stored-token",
    },
  });

  assert.deepEqual(resolved, {
    sessionId: "",
    accessToken: "",
    requestedStep: 1,
    shouldCreateSession: true,
    shouldClearStoredSession: true,
  });
});

test("resolveProfileReviewEntry prefers explicit URL session over stored session", () => {
  const resolved = resolveProfileReviewEntry({
    searchParams: new URLSearchParams(
      "sessionId=url-session&accessToken=url-token&step=17"
    ),
    storedSession: {
      sessionId: "stored-session",
      accessToken: "stored-token",
    },
  });

  assert.deepEqual(resolved, {
    sessionId: "url-session",
    accessToken: "url-token",
    requestedStep: 17,
    shouldCreateSession: false,
    shouldClearStoredSession: false,
  });
});

test("resolveProfileReviewEntry reuses stored session only when fresh mode is not requested", () => {
  const resolved = resolveProfileReviewEntry({
    searchParams: new URLSearchParams("step=11"),
    storedSession: {
      sessionId: "stored-session",
      accessToken: "stored-token",
    },
  });

  assert.deepEqual(resolved, {
    sessionId: "stored-session",
    accessToken: "stored-token",
    requestedStep: 11,
    shouldCreateSession: false,
    shouldClearStoredSession: false,
  });
});

test("shouldSkipProfileReviewReinitialization returns true for internal step changes on the same session", () => {
  const resolved = resolveProfileReviewEntry({
    searchParams: new URLSearchParams(
      "sessionId=active-session&accessToken=active-token&step=8"
    ),
    storedSession: null,
  });

  const shouldSkip = shouldSkipProfileReviewReinitialization({
    activeSession: {
      sessionId: "active-session",
      accessToken: "active-token",
    },
    resolvedEntry: resolved,
  });

  assert.equal(shouldSkip, true);
});
