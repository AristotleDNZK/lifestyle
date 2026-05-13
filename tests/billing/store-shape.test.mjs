import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("Paddle billing migration creates order, event, ledger, and subscription tables", () => {
  const sql = read("supabase/migrations/20260506_paddle_v1_billing.sql");

  assert.match(sql, /create table if not exists billing_orders/i);
  assert.match(sql, /create table if not exists billing_events/i);
  assert.match(sql, /create table if not exists credit_ledger/i);
  assert.match(sql, /create table if not exists subscriptions/i);
  assert.match(sql, /provider_transaction_id text/i);
  assert.match(sql, /unique\s*\(\s*provider\s*,\s*event_id\s*\)/i);
  assert.match(sql, /unique\s*\(\s*provider\s*,\s*provider_transaction_id\s*\)/i);
  assert.match(sql, /idx_billing_orders_user_created/i);
  assert.match(sql, /idx_credit_ledger_user_created/i);
});

test("billing store exposes persistence helpers used by checkout and webhook", () => {
  const source = read("lib/billing/store.ts");

  assert.match(source, /export async function createBillingOrder/);
  assert.match(source, /export async function recordBillingEvent/);
  assert.match(source, /export async function getBillingOrder/);
  assert.match(source, /export async function markBillingOrderPaid/);
  assert.match(source, /export async function markBillingOrderFulfilled/);
  assert.match(source, /export async function addCreditLedgerEntry/);
  assert.match(source, /export async function upsertSubscription/);
  assert.match(source, /export async function markProfileReviewOrderPaid/);
});
