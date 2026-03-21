# Profile Review Design

**Date:** 2026-03-15

## Goal

Add a complete dating profile photo review funnel that starts from the homepage and review landing page, walks users through the 25-step reference flow, stores every answer and upload, generates a preview score capped at 50, blocks the full report behind authentication and a mock paid unlock, then delivers the full report both on-site and by email.

## Product Flow

1. Homepage top nav `Dating Profile Review` links to a dedicated landing page.
2. The landing page matches the provided review marketing page and sends users into the quiz flow when they click `REVIEW MY PROFILE`.
3. The quiz flow renders the `1.png` to `25.png` sequence from a configuration-driven step engine instead of 25 separate page files.
4. Every option click is persisted before navigating forward.
5. Users can upload 1-9 profile photos during the upload steps.
6. The system analyzes the questionnaire answers plus uploaded photos and creates:
   - a preview report for the paywall screen
   - a full report for email and the unlocked report page
7. The preview score is always within `0-50`.
8. When users try to unlock the full report, they must sign in or sign up with Clerk.
9. After authentication they complete a mock checkout flow priced at `$3.99`.
10. Successful payment unlocks the on-site report page and triggers report delivery by email.

## Architecture

### Frontend

- Add `/dating-profile-review` as the dedicated landing page.
- Add `/dating-profile-review/quiz` as a single client-rendered step engine.
- Add `/dating-profile-review/report/[sessionId]` as the unlocked full report page.
- Keep visual styling close to the provided reference assets.
- Store current session id locally so non-authenticated users can complete the funnel until unlock.

### Backend

- Add dedicated profile review APIs for:
  - session creation
  - answer persistence
  - photo upload
  - analysis status polling
  - mock checkout
  - report retrieval
- Add a dedicated Trigger.dev v4 task for report generation.
- Reuse existing Clerk auth for unlock gating and user association.

### Storage

- Do not use ImgBB for this funnel because user dating photos should not become public URLs by default.
- Use a private Supabase Storage bucket for uploaded review photos.
- Generate signed URLs only when the model or authenticated report page needs access.

## Data Model

### `profile_review_sessions`

One row per funnel run.

- `id`
- `user_id nullable`
- `status`
- `current_step`
- `email nullable`
- `preview_score nullable`
- `final_score nullable`
- `started_at`
- `completed_at nullable`
- `paid_at nullable`
- `delivered_at nullable`

### `profile_review_answers`

One row per answered step.

- `id`
- `session_id`
- `step_key`
- `question`
- `answer_value`
- `answer_label`
- `raw_payload jsonb`
- `answered_at`

### `profile_review_images`

One row per uploaded image.

- `id`
- `session_id`
- `storage_provider`
- `storage_path`
- `signed_url_cache nullable`
- `sort_order`
- `analysis_status`
- `analysis_score nullable`
- `created_at`

### `profile_review_reports`

Stores both preview and full reports.

- `id`
- `session_id`
- `model_name`
- `model_version`
- `prompt_version`
- `preview_report jsonb`
- `full_report jsonb`
- `raw_model_output jsonb`
- `generated_at`

### `profile_review_orders`

Tracks the mock unlock transaction.

- `id`
- `session_id`
- `user_id`
- `amount`
- `currency`
- `status`
- `provider`
- `provider_order_id`
- `paid_at nullable`
- `created_at`

## Model Strategy

### Recommendation

Use a two-stage Gemini pipeline:

1. `gemini-2.5-flash-lite` for per-photo structured observations
2. `gemini-2.5-flash` for final combined scoring and detailed recommendations

Optionally fall back to `gemini-2.5-pro` only when final combined output fails validation.

### Why

- Keeps cost low enough for a `$3.99` unlock price.
- Preserves enough output quality for granular, actionable recommendations.
- Separates observation from judgment, which makes scoring and recommendations more stable.

### Score Control

- The system uses a real `0-50` scale.
- The prompt requires conservative scoring.
- JSON schema constrains the score to `0-50`.
- Backend post-processing clamps any out-of-range value.

## Prompt Strategy

The prompt consumes:

- questionnaire answers
- user intent and pain points inferred from those answers
- photo count and order
- structured observations per uploaded photo

The model must return:

- `overallScore`
- weighted dimension scores
- best and worst photos
- top issues
- quick wins
- recommended photo order
- detailed per-photo fixes
- retake blueprints
- a seven-day action plan
- short preview copy for the paywall page

Recommendations should be highly specific, evidence-based, and tied to what the user said they want to improve.

## Unlock and Delivery

- Preview report is available before payment.
- Full report requires authentication plus successful mock payment.
- After payment:
  - link session to authenticated user
  - unlock `/dating-profile-review/report/[sessionId]`
  - send report email

## Configuration

Required additions to `.env.local`:

- `GEMINI_API_KEY`
- `PROFILE_REVIEW_OBSERVATION_MODEL`
- `PROFILE_REVIEW_REPORT_MODEL`
- `GEMINI_TIMEOUT_MS`
- `GEMINI_PROXY_URL` optional
- `RESEND_API_KEY`
- `PROFILE_REVIEW_REPORT_FROM_EMAIL`
- `PROFILE_REVIEW_REPORT_REPLY_TO`
- `PROFILE_REVIEW_UNLOCK_PRICE_USD`
- `PROFILE_REVIEW_STORAGE_BUCKET`
- `PROFILE_REVIEW_MAX_UPLOAD_IMAGES`
- `PROFILE_REVIEW_SCORE_MAX`

## Operational Notes

- Supabase Storage private bucket should be created before deployment.
- Trigger.dev config and tasks should be moved to v4 syntax to match repository requirements.
- The mock checkout data model should stay production-shaped so real Stripe can replace it later without schema churn.
