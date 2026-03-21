# Profile Review Fresh Entry Design

**Date:** 2026-03-15

## Goal

When a user leaves the photo review funnel and later re-enters it from a public entry point, the app should start a brand new review session from the first reference page instead of restoring the prior preview/report state.

## Approved Behavior

- Public funnel entry points open the quiz with `fresh=1`.
- When the quiz initializes with `fresh=1`, it must:
  - clear the locally stored profile review session pointer
  - ignore any previously stored session
  - create a new backend session
  - start from step 1
- Internal funnel navigation keeps using the current `sessionId`, `accessToken`, and `step`.
- Existing unlock/report deep links remain valid for explicit direct access, but they are not used as default re-entry behavior.

## Rationale

The current implementation stores a guest session in local storage and reuses it later. That is useful for accidental refresh, but it conflicts with the business requirement for “re-entering the funnel means restart from 1.png and upload new photos again.”

Using an explicit `fresh=1` signal on public entry points is the smallest safe change because it:

- avoids breaking in-flow navigation
- preserves deep-link access to an existing session when the user intentionally opens it
- keeps old sessions in the database for analytics and audit

## Affected Areas

- Public CTA links that launch the quiz
- Client-side quiz initialization logic
- Local session persistence helpers
- Regression tests for session source resolution

## Risks

- Missing an entry point would leave one path still restoring an old session.
- Over-aggressive clearing could break explicit deep links if applied outside `fresh=1`.

## Mitigation

- Centralize fresh-entry detection in a small helper
- Add regression tests for `fresh=1` vs stored-session reuse
- Verify public entry routes all append `fresh=1`
