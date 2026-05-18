import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("local dev auth bypass is available without Google OAuth", () => {
  assert.ok(
    existsSync(path.join(process.cwd(), "app/api/dev-login/route.ts")),
    "dev login route should exist"
  );

  const devAuth = source("lib/local-dev-auth.ts");
  const devAuthShared = source("lib/local-dev-auth-shared.ts");
  const devLogin = source("app/api/dev-login/route.ts");
  const middleware = source("middleware.ts");

  assert.match(devAuth, /getAppAuthSession/);
  assert.match(devAuth, /next\/headers/);
  assert.match(devAuthShared, /LOCAL_DEV_AUTH_COOKIE/);
  assert.match(devAuthShared, /NODE_ENV !== "production"/);
  assert.match(devAuthShared, /dev-user-datingphotosai/);
  assert.match(devAuthShared, /nuoweileinaxiawan@gmail\.com/);
  assert.match(devAuthShared, /LOCAL_DEV_CREDIT_BALANCE = 99999/);

  assert.match(devLogin, /LOCAL_DEV_AUTH_COOKIE/);
  assert.match(devLogin, /@\/lib\/local-dev-auth-shared/);
  assert.doesNotMatch(devLogin, /@\/lib\/local-dev-auth";/);
  assert.match(devLogin, /httpOnly: true/);
  assert.match(devLogin, /sameSite: "lax"/);
  assert.match(devLogin, /\/workspace\/image-to-image/);
  assert.doesNotMatch(devLogin, /accounts\.google\.com|oauth2|googleusercontent/);

  assert.match(middleware, /LOCAL_DEV_AUTH_COOKIE/);
  assert.match(middleware, /@\/lib\/local-dev-auth-shared/);
  assert.doesNotMatch(middleware, /@\/lib\/local-dev-auth";/);
  assert.match(middleware, /isLocalDevAuthEnabled/);
  assert.match(middleware, /request\.cookies\.has\(LOCAL_DEV_AUTH_COOKIE\)/);
  assert.match(middleware, /NextResponse\.redirect/);
  assert.match(middleware, /\/api\/dev-login/);
  assert.match(middleware, /request\.nextUrl\.pathname/);
});

test("profile review auth gates use the shared app auth session", () => {
  const sessionRoute = source("app/api/auth/session/route.ts");
  const unlockPage = source("app/dating-profile-review/unlock/[sessionId]/page.tsx");
  const checkoutPage = source("app/dating-profile-review/checkout/[sessionId]/page.tsx");
  const reportPage = source("app/dating-profile-review/report/[sessionId]/page.tsx");
  const attachRoute = source("app/api/profile-review/session/[sessionId]/attach-user/route.ts");
  const checkoutRoute = source("app/api/payments/profile-review/checkout/route.ts");
  const mockCheckoutRoute = source("app/api/profile-review/session/[sessionId]/mock-checkout/route.ts");

  assert.match(sessionRoute, /getAppAuthSession/);
  assert.match(source("app/api/user/stats/route.ts"), /LOCAL_DEV_CREDIT_BALANCE/);
  assert.match(sessionRoute, /localDevAuthEnabled/);
  assert.match(unlockPage, /\/api\/auth\/session/);
  assert.match(checkoutPage, /\/api\/auth\/session/);
  assert.match(reportPage, /\/api\/auth\/session/);
  assert.match(unlockPage, /localDevAuthEnabled/);
  assert.match(checkoutPage, /localDevAuthEnabled/);
  assert.match(reportPage, /localDevAuthEnabled/);
  assert.match(attachRoute, /getAppAuthSession/);
  assert.match(checkoutRoute, /getAppAuthSession/);
  assert.match(mockCheckoutRoute, /getAppAuthSession/);
  assert.doesNotMatch(attachRoute, /const userId = await getCurrentUserId\(\)/);
});

test("AI Photos local development continue action uses site-local login", () => {
  const aiPhotos = source("app/ai-photos/page.tsx");

  assert.match(aiPhotos, /LOCAL_DEV_WORKSPACE_LOGIN_URL/);
  const devAuthShared = source("lib/local-dev-auth-shared.ts");

  assert.match(devAuthShared, /\/api\/dev-login\?redirect=\/workspace\/image-to-image/);
  assert.match(aiPhotos, /isLocalDevAuthEnabled/);
  assert.doesNotMatch(aiPhotos, /@\/lib\/local-dev-auth";/);
});

test("workspace APIs accept local dev auth fallback", () => {
  const files = [
    "app/api/user/stats/route.ts",
    "app/api/user/generations/route.ts",
    "app/api/generate/route.ts",
    "app/api/generate/[jobId]/route.ts",
    "app/api/payments/checkout/route.ts",
  ];

  for (const file of files) {
    const text = source(file);
    assert.match(text, /getAppAuthSession/);
    assert.doesNotMatch(text, /const \{ userId \} = await auth\(\)/);
  }
});
