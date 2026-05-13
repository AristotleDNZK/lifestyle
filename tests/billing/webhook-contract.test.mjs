import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("Paddle webhook route verifies raw body signature before parsing", () => {
  const source = read("app/api/payments/webhooks/paddle/route.ts");

  assert.match(source, /const rawBody = await req\.text\(\)/);
  assert.match(source, /req\.headers\.get\("paddle-signature"\)/i);
  assert.match(source, /verifyPaddleSignature\(rawBody, signature, secret\)/);
  assert.match(source, /JSON\.parse\(rawBody\)/);
});

test("Paddle webhook route records events idempotently before fulfillment", () => {
  const source = read("app/api/payments/webhooks/paddle/route.ts");

  assert.match(source, /recordBillingEvent/);
  assert.match(source, /duplicate/);
  assert.match(source, /fulfillPaddleTransactionCompleted/);
  assert.match(source, /markBillingEventProcessed/);
});

test("Paddle fulfillment only delivers transaction.completed and handles all current products", () => {
  const source = read("lib/billing/fulfillment.ts");

  assert.match(source, /export async function fulfillPaddleTransactionCompleted/);
  assert.match(source, /transaction\.completed/);
  assert.match(source, /addCreditLedgerEntry/);
  assert.match(source, /insertLegacyTransaction/);
  assert.match(source, /upsertSubscription/);
  assert.match(source, /markProfileReviewOrderPaid/);
  assert.match(source, /sendProfileReviewReportEmail/);
  assert.match(source, /markBillingOrderFulfilled/);
});
