import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("env example documents required Paddle v1.0 variables", () => {
  const source = read(".env.local.example");

  assert.match(source, /PADDLE_ENVIRONMENT=sandbox/);
  assert.match(source, /NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox/);
  assert.match(source, /PADDLE_API_KEY=/);
  assert.match(source, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=/);
  assert.match(source, /PADDLE_WEBHOOK_SECRET=/);
  assert.match(source, /PADDLE_PRICE_CREDITS_STARTER=/);
  assert.match(source, /PADDLE_PRICE_CREDITS_POPULAR=/);
  assert.match(source, /PADDLE_PRICE_CREDITS_PRO=/);
  assert.match(source, /PADDLE_PRICE_SUB_MINI_MONTHLY=/);
  assert.match(source, /PADDLE_PRICE_SUB_STANDARD_MONTHLY=/);
  assert.match(source, /PADDLE_PRICE_SUB_PLUS_MONTHLY=/);
  assert.match(source, /PADDLE_PRICE_PROFILE_REVIEW_UNLOCK=/);
});

test("Paddle review submission material names paddle_v1.0 and manual dashboard steps", () => {
  const source = read("docs/paddle_v1.0_审核提交材料.md");

  assert.match(source, /paddle_v1\.0/);
  assert.match(source, /不改变产品形态/);
  assert.match(source, /Paddle Dashboard/);
  assert.match(source, /Domain Review/);
  assert.match(source, /Notification Destination/);
  assert.match(source, /Webhook URL/);
  assert.match(source, /人工/);
});

test("Paddle tutorial references the implemented paddle_v1.0 code endpoints", () => {
  const source = read("docs/Padlle支付教程.md");

  assert.match(source, /paddle_v1\.0/);
  assert.match(source, /\/api\/payments\/checkout/);
  assert.match(source, /\/api\/payments\/profile-review\/checkout/);
  assert.match(source, /\/api\/payments\/webhooks\/paddle/);
  assert.match(source, /20260506_paddle_v1_billing\.sql/);
});
