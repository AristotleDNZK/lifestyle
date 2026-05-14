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

  assert.match(devLogin, /LOCAL_DEV_AUTH_COOKIE/);
  assert.match(devLogin, /httpOnly: true/);
  assert.match(devLogin, /sameSite: "lax"/);
  assert.match(devLogin, /\/workspace\/image-to-image/);
  assert.doesNotMatch(devLogin, /accounts\.google\.com|oauth2|googleusercontent/);

  assert.match(middleware, /LOCAL_DEV_AUTH_COOKIE/);
  assert.match(middleware, /isLocalDevAuthEnabled/);
  assert.match(middleware, /request\.cookies\.has\(LOCAL_DEV_AUTH_COOKIE\)/);
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
