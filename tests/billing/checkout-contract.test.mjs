import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("generic Paddle checkout API creates internal orders from server catalog", () => {
  const source = read("app/api/payments/checkout/route.ts");

  assert.match(source, /auth\(\)/);
  assert.match(source, /currentUser\(\)/);
  assert.match(source, /getCatalogItem\(sku\)/);
  assert.match(source, /createBillingOrder/);
  assert.match(source, /getPaddlePriceId/);
  assert.match(source, /customData/);
  assert.match(source, /order_id: order\.id/);
  assert.doesNotMatch(source, /body\.amount/);
  assert.doesNotMatch(source, /body\.credits/);
});

test("profile review Paddle checkout API verifies session access and returns profile metadata", () => {
  const source = read("app/api/payments/profile-review/checkout/route.ts");

  assert.match(source, /requireProfileReviewAccess/);
  assert.match(source, /getProfileReviewReport/);
  assert.match(source, /profile_review_unlock/);
  assert.match(source, /profile_review_session_id/);
  assert.match(source, /createBillingOrder/);
  assert.match(source, /order_id: order\.id/);
});

test("Paddle browser type includes checkout open with items and transaction id modes", () => {
  const source = read("types/paddle.d.ts");

  assert.match(source, /interface Window/);
  assert.match(source, /Paddle/);
  assert.match(source, /Checkout/);
  assert.match(source, /open/);
  assert.match(source, /priceId/);
  assert.match(source, /transactionId/);
});
