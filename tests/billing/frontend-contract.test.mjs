import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("app layout loads Paddle script globally", () => {
  const layout = read("app/layout.tsx");
  const script = read("app/_components/paddle-script.tsx");

  assert.match(layout, /PaddleScript/);
  assert.match(script, /https:\/\/cdn\.paddle\.com\/paddle\/v2\/paddle\.js/);
  assert.match(script, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/);
  assert.match(script, /NEXT_PUBLIC_PADDLE_ENVIRONMENT/);
});

test("public pricing page opens Paddle checkout instead of Stripe checkout", () => {
  const source = read("app/pricing/page.tsx");

  assert.match(source, /\/api\/payments\/checkout/);
  assert.match(source, /window\.Paddle\?\.Checkout\.open/);
  assert.doesNotMatch(source, /\/api\/stripe\/checkout/);
  assert.doesNotMatch(source, /Secure payment processing via Stripe/);
});

test("workspace pricing page triggers Paddle subscription checkout", () => {
  const source = read("app/workspace/pricing/page.tsx");

  assert.match(source, /"use client"/);
  assert.match(source, /\/api\/payments\/checkout/);
  assert.match(source, /window\.Paddle\?\.Checkout\.open/);
  assert.match(source, /sub_mini_monthly/);
  assert.match(source, /sub_standard_monthly/);
  assert.match(source, /sub_plus_monthly/);
});

test("profile review checkout uses Paddle profile review checkout API instead of mock checkout", () => {
  const source = read("app/dating-profile-review/checkout/[sessionId]/page.tsx");

  assert.match(source, /\/api\/payments\/profile-review\/checkout/);
  assert.match(source, /window\.Paddle\?\.Checkout\.open/);
  assert.doesNotMatch(source, /\/mock-checkout/);
});
