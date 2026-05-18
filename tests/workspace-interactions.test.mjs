import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("AI photo optimization sends all uploaded source images to the generation API", () => {
  const page = source("app/workspace/image-to-image/page.tsx");
  const route = source("app/api/generate/route.ts");
  const triggerTask = source("src/trigger/image-generation.ts");
  const gemini = source("lib/gemini-image-generation.ts");
  const jobs = source("lib/generation-jobs.ts");

  assert.match(page, /images:\s*uploadedImages\.map/);
  assert.doesNotMatch(page, /const first = uploadedImages\[0\]/);
  assert.match(route, /images\?:\s*Array/);
  assert.match(route, /normalizeRequestImages/);
  assert.match(route, /images:\s*requestImages/);
  assert.match(jobs, /images\?:\s*Array/);
  assert.match(triggerTask, /GenerateImagePayload/);
  assert.match(gemini, /images\?:\s*GeminiInputImage\[\]/);
  assert.match(gemini, /inputImages\.forEach/);
});

test("AI photo optimization uses Gemini image generation in local dev instead of placeholder images", () => {
  const route = source("app/api/generate/route.ts");
  const localStore = source("lib/local-dev-generations.ts");
  const triggerTask = source("src/trigger/image-generation.ts");
  const jobs = source("lib/generation-jobs.ts");
  const gemini = source("lib/gemini-image-generation.ts");

  assert.match(route, /requestGeminiImage/);
  assert.match(route, /createLocalGenerationJob\(\{/);
  assert.match(route, /imageUrl:\s*uploadResult\.url/);
  assert.match(route, /provider:\s*"gemini"/);
  assert.match(localStore, /imageUrl:\s*string/);
  assert.doesNotMatch(localStore, /\/homepage\/hero-after\.png/);
  assert.match(jobs, /gemini-3\.1-flash-image-preview/);
  assert.match(jobs, /gemini-3-pro-image-preview/);
  assert.match(triggerTask, /requestGeminiImage/);
  assert.match(gemini, /generativelanguage\.googleapis\.com/);
  assert.match(gemini, /inlineData/);
  assert.match(gemini, /responseModalities:\s*\["TEXT", "IMAGE"\]/);
  assert.match(gemini, /rawAspectRatio\.toLowerCase\(\) !== "auto"/);
  assert.doesNotMatch(gemini, /responseFormat:\s*\{/);
});

test("AI photo optimization keeps prompt field visually blank while submitting the default prompt", () => {
  const page = source("app/workspace/image-to-image/page.tsx");

  assert.match(page, /useSessionStorageState<string>\("i2i_prompt", ""\)/);
  assert.match(page, /value=\{prompt\}/);
  assert.match(
    page,
    /const promptText = \(prompt \|\| ""\)\.trim\(\) \|\| DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;/
  );
  assert.match(page, /if \(prompt === DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT\)/);
  assert.match(page, /setPrompt\(""\)/);
  assert.doesNotMatch(page, /setPrompt\(DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT\)/);
});

test("Gemini image generation falls back between proxy and direct network paths", () => {
  const gemini = source("lib/gemini-image-generation.ts");
  const checkScript = source("scripts/check-gemini-network.mjs");

  assert.match(gemini, /buildGeminiFetchCandidates/);
  assert.match(gemini, /getExplicitGeminiProxyUrl/);
  assert.match(gemini, /getAutoLocalProxyUrls/);
  assert.match(gemini, /GEMINI_AUTO_PROXY/);
  assert.match(gemini, /GEMINI_USE_SYSTEM_PROXY/);
  assert.match(gemini, /label:\s*"proxy"/);
  assert.match(gemini, /"auto-proxy"/);
  assert.match(gemini, /label:\s*"direct"/);
  assert.match(gemini, /for \(const candidate of fetchCandidates\)/);
  assert.match(gemini, /lastNetworkError/);
  assert.match(gemini, /GEMINI_NETWORK_ERROR_MESSAGE/);
  assert.match(gemini, /if \(process\.env\.GEMINI_USE_SYSTEM_PROXY !== "1"\)/);
  assert.doesNotMatch(gemini, /const customFetch = getProxiedFetch\(\)/);

  const route = source("app/api/generate/route.ts");
  const triggerTask = source("src/trigger/image-generation.ts");
  assert.match(route, /diagnostic:/);
  assert.match(triggerTask, /GEMINI_NETWORK_ERROR_MESSAGE/);
  assert.match(checkScript, /\$\{candidate\.label\}:generate/);
  assert.match(checkScript, /getAutoLocalProxyUrls/);
  assert.match(checkScript, /GEMINI_AUTO_PROXY/);
  assert.match(checkScript, /label:\s*"direct"/);
  assert.match(checkScript, /label:\s*"proxy"/);
});

test("Gemini image generation can fall back to a secured server relay", () => {
  const gemini = source("lib/gemini-image-generation.ts");
  const relayRoute = source("app/api/gemini/relay/route.ts");
  const checkScript = source("scripts/check-gemini-network.mjs");

  assert.match(gemini, /GEMINI_RELAY_URL/);
  assert.match(gemini, /GEMINI_RELAY_SECRET/);
  assert.match(gemini, /"relay-proxy"/);
  assert.match(gemini, /"relay-direct"/);
  assert.match(gemini, /x-gemini-relay-secret/);
  assert.match(gemini, /requestGeminiImageDirect/);

  assert.match(relayRoute, /runtime = "nodejs"/);
  assert.match(relayRoute, /dynamic = "force-dynamic"/);
  assert.match(relayRoute, /x-gemini-relay-secret/);
  assert.match(relayRoute, /requestGeminiImageDirect/);
  assert.match(relayRoute, /Unauthorized/);

  assert.match(checkScript, /GEMINI_RELAY_URL/);
  assert.match(checkScript, /\$\{relayCandidate\.label\}:generate/);
});

test("Gemini relay requests reuse configured proxy network paths in local dev", () => {
  const gemini = source("lib/gemini-image-generation.ts");
  const checkScript = source("scripts/check-gemini-network.mjs");

  assert.match(gemini, /buildRelayFetchCandidates/);
  assert.match(gemini, /"relay-proxy"/);
  assert.match(gemini, /candidate\.fetch\(endpoint/);
  assert.match(checkScript, /"relay-proxy"/);
  assert.match(checkScript, /\$\{relayCandidate\.label\}:generate/);
});

test("AI photo optimization supports importing images from My Creations", () => {
  const page = source("app/workspace/image-to-image/page.tsx");

  assert.match(page, /showCreationPicker/);
  assert.match(page, /CreationPickerModal/);
  assert.match(page, /\/api\/user\/generations\?limit=100&type=image/);
  assert.match(page, /importCreations/);
  assert.doesNotMatch(page, /Placeholder: hook into/);
});

test("AI photo optimization multi-shot queues multiple image jobs", () => {
  const page = source("app/workspace/image-to-image/page.tsx");

  assert.match(page, /generationCount = multiShot \? 3 : 1/);
  assert.match(page, /queuedJobIds/);
  assert.match(page, /Promise\.all\(queuedJobIds\.map/);
});

test("workspace account hides avatar upload, saves display name, opens Paddle recharge, and labels sample activity", () => {
  const page = source("app/workspace/account/page.tsx");

  assert.doesNotMatch(page, /Upload Avatar/);
  assert.match(page, /nameValue/);
  assert.match(page, /await user\.update/);
  assert.match(page, /handleRechargeCredits/);
  assert.match(page, /credits_popular/);
  assert.match(page, /window\.Paddle\?\.Checkout\.open/);
  assert.match(page, /Example activity/);
});

test("workspace pricing implements monthly/yearly toggle and removes inert FAQ More labels", () => {
  const page = source("app/workspace/pricing/page.tsx");

  assert.match(page, /billingCycle/);
  assert.match(page, /setBillingCycle\("monthly"\)/);
  assert.match(page, /setBillingCycle\("yearly"\)/);
  assert.match(page, /billed \{billingCycle\}/);
  assert.doesNotMatch(page, />More</);
});

test("workspace sidebar help opens a mail client", () => {
  const sidebar = source("app/workspace/_components/workspace-sidebar.tsx");

  assert.match(sidebar, /mailto:support@datingphotosai\.com/);
  assert.doesNotMatch(sidebar, /label: "Help & Feedback" \}/);
});

test("legacy workspace entry pages redirect into the active AI photo workspace", () => {
  const dashboard = source("app/dashboard/page.tsx");
  const generate = source("app/generate/page.tsx");

  assert.match(dashboard, /redirect\("\/workspace\/image-to-image"\)/);
  assert.match(generate, /redirect\("\/workspace\/image-to-image"\)/);
  assert.doesNotMatch(dashboard, /href="\/generate"/);
  assert.doesNotMatch(generate, /Video Generation/);
});

test("my creations hides video-only tab and empty state links to AI photo optimization", () => {
  const page = source("app/workspace/my-creations/page.tsx");

  assert.doesNotMatch(page, /Videos/);
  assert.doesNotMatch(page, /setTab\("videos"\)/);
  assert.match(page, /href="\/workspace\/image-to-image"/);
});

test("my creations does not expose internal API failures on the page", () => {
  const page = source("app/workspace/my-creations/page.tsx");
  const api = source("app/api/user/generations/route.ts");
  const auth = source("lib/local-dev-auth.ts");

  assert.match(auth, /try\s*\{/);
  assert.match(auth, /currentUser\(\)/);
  assert.match(auth, /currentUserError/);
  assert.match(api, /Failed to load generation history/);
  assert.doesNotMatch(api, /error\.message \|\| "Internal server error"/);
  assert.doesNotMatch(page, /\{error\}/);
  assert.doesNotMatch(page, /setError\(e\?\.message/);
  assert.match(page, /We couldn't refresh your creations right now\./);
});

test("local dev generation flow persists real Gemini records for My Creations", () => {
  assert.ok(
    source("lib/local-dev-generations.ts"),
    "local dev generation store should exist"
  );

  const generateRoute = source("app/api/generate/route.ts");
  const jobRoute = source("app/api/generate/[jobId]/route.ts");
  const generationsRoute = source("app/api/user/generations/route.ts");
  const statsRoute = source("app/api/user/stats/route.ts");
  const localStore = source("lib/local-dev-generations.ts");

  assert.match(localStore, /__datingPhotosAiLocalGenerations/);
  assert.match(localStore, /createLocalGenerationJob/);
  assert.match(localStore, /listLocalGenerationJobs/);
  assert.match(localStore, /getLocalGenerationJob/);
  assert.match(generateRoute, /createLocalGenerationJob/);
  assert.match(generateRoute, /requestGeminiImage/);
  assert.doesNotMatch(localStore, /hero-after\.png/);
  assert.match(jobRoute, /getLocalGenerationJob/);
  assert.match(generationsRoute, /listLocalGenerationJobs/);
  assert.match(statsRoute, /LOCAL_DEV_CREDIT_BALANCE/);
});

test("profile review removes unsupported import and upsell choices", () => {
  const renderer = source("app/dating-profile-review/_components/profile-review-step-renderer.tsx");
  const client = source("app/dating-profile-review/_components/profile-review-quiz-client.tsx");
  const steps = source("lib/profile-review/steps.ts");

  assert.doesNotMatch(renderer, /Import from Tinder|Import from Instagram/);
  assert.doesNotMatch(client, /handleUpsellChoice/);
  assert.doesNotMatch(steps, /type:\s*"upsell"/);
  assert.doesNotMatch(steps, /style_upsell/);
});

test("profile review quiz recovers cleanly when the session is not ready", () => {
  const client = source("app/dating-profile-review/_components/profile-review-quiz-client.tsx");
  const renderer = source("app/dating-profile-review/_components/profile-review-step-renderer.tsx");
  const http = source("lib/profile-review/http.ts");
  const sessionRoute = source("app/api/profile-review/session/route.ts");
  const localStore = source("lib/profile-review/local-dev-store.ts");

  assert.match(sessionRoute, /createLocalProfileReviewSession/);
  assert.match(localStore, /LOCAL_DEV_PROFILE_REVIEW_SESSION_PREFIX/);
  assert.match(localStore, /globalThis/);
  assert.match(localStore, /__datingPhotosAiProfileReviewSessions/);
  assert.match(localStore, /buildLocalPreviewReport/);
  assert.match(localStore, /saveLocalProfileReviewAnswer/);
  assert.match(localStore, /completeLocalProfileReviewUpload/);
  assert.match(client, /handleRetryInitialization/);
  assert.match(client, /sessionReady/);
  assert.match(client, /We're preparing your review session\./);
  assert.doesNotMatch(client, /Missing active profile review session/);
  assert.match(renderer, /const interactionDisabled = busy \|\| !sessionReady/);
  assert.match(renderer, /disabled=\{interactionDisabled\}/);
  assert.doesNotMatch(renderer, /\{error\}/);
  assert.match(http, /We couldn't prepare your review session/);
  assert.doesNotMatch(http, /error instanceof Error \? error\.message/);
});

test("profile review quiz creates a fresh session when a stored session is stale", () => {
  const client = source("app/dating-profile-review/_components/profile-review-quiz-client.tsx");
  const entry = source("lib/profile-review/client-entry.ts");

  assert.match(entry, /shouldCreateSession/);
  assert.match(client, /isProfileReviewSessionUnavailable/);
  assert.match(client, /await createSession\(\)/);
  assert.match(client, /activeStep = created\.currentStep/);
  assert.match(client, /clearStoredSession\(\)/);
  assert.match(client, /setSessionId\(activeSessionId\)/);
});

test("profile review local upload keeps the user's uploaded photos in the report", () => {
  const localStore = source("lib/profile-review/local-dev-store.ts");

  assert.match(localStore, /fileToDataUrl/);
  assert.match(localStore, /signedUrl:\s*dataUrl/);
  assert.doesNotMatch(localStore, /signedUrl:\s*"\/homepage\/hero-before\.png"/);
});

test("profile review unlock page has deterministic return and checkout actions", () => {
  const unlockPage = source("app/dating-profile-review/unlock/[sessionId]/page.tsx");

  assert.match(unlockPage, /const previewUrl =/);
  assert.match(unlockPage, /goBackToPreview/);
  assert.doesNotMatch(unlockPage, /router\.back\(\)/);
  assert.match(unlockPage, /handleStartCheckout/);
  assert.match(unlockPage, /router\.push\(\s*`\/dating-profile-review\/checkout/);
  assert.match(unlockPage, /const authLoaded = appAuth !== null/);
  assert.doesNotMatch(unlockPage, /const authLoaded = isLoaded && appAuth !== null/);
  assert.match(unlockPage, /Pay \$\$\{unlockPriceUsd\.toFixed\(2\)\}/);
  assert.match(unlockPage, /z-20/);
});

test("AI Photos funnel carries answers, email, and uploads into the workspace without requiring purchase first", () => {
  const aiPhotos = source("app/ai-photos/page.tsx");

  assert.match(aiPhotos, /persistWorkspaceHandoff/);
  assert.match(aiPhotos, /handleContinueToWorkspace/);
  assert.match(aiPhotos, /router\.push\(LOCAL_DEV_WORKSPACE_LOGIN_URL\)/);
  assert.match(aiPhotos, /i2i_uploadedImages/);
  assert.match(aiPhotos, /i2i_prompt/);
  assert.match(aiPhotos, /dataUrl: String\(reader\.result \|\| ""\)/);
  assert.match(aiPhotos, /Continue to workspace/);
  assert.match(aiPhotos, /\/workspace\/image-to-image/);
});
