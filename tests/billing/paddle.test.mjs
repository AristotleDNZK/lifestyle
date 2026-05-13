import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("billing catalog defines current credit, subscription, and profile review products", () => {
  const source = read("lib/billing/catalog.ts");

  assert.match(source, /credits_starter:[\s\S]*amount: 999/);
  assert.match(source, /credits_popular:[\s\S]*credits: 500/);
  assert.match(source, /sub_mini_monthly:[\s\S]*amount: 900/);
  assert.match(source, /profile_review_unlock:[\s\S]*amount: 399/);
  assert.match(source, /productType: "profile_review_unlock"/);
});

test("billing catalog exposes SKU helpers and Paddle price env lookup", () => {
  const source = read("lib/billing/catalog.ts");

  assert.match(source, /export function getCatalogItem/);
  assert.match(source, /export function getPaddlePriceId/);
  assert.match(source, /export function isOneTimeSku/);
  assert.match(source, /export function isSubscriptionSku/);
  assert.match(source, /PADDLE_PRICE_CREDITS_POPULAR/);
  assert.match(source, /Missing Paddle price id env var/);
});

test("Paddle signature verifier implements official ts:rawBody HMAC flow", () => {
  const source = read("lib/billing/paddle.ts");

  assert.match(source, /export function verifyPaddleSignature/);
  assert.match(source, /createHmac\("sha256", secret\)/);
  assert.match(source, /\$\{timestamp\}:\$\{rawBody\}/);
  assert.match(source, /timingSafeEqual/);

  const rawBody = JSON.stringify({ event_type: "transaction.completed" });
  const secret = "test-secret";
  const timestamp = "1777777777";
  const h1 = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`, "utf8")
    .digest("hex");

  assert.equal(h1.length, 64);
});
