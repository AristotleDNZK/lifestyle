import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

test("Paddle review policy URLs have public Next.js pages", () => {
  const requiredPages = [
    ["app/terms-and-conditions/page.tsx", "Terms and Conditions"],
    ["app/privacy/page.tsx", "Privacy Policy"],
    ["app/refund/page.tsx", "Refund Policy"],
  ];

  for (const [path, title] of requiredPages) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} should exist`);
    assert.match(read(path), new RegExp(title));
  }
});

test("terms page includes Paddle Merchant of Record disclosure", () => {
  const source = read("app/terms-and-conditions/page.tsx");

  assert.match(source, /Paddle\.com is the Merchant of Record for all our orders/);
  assert.match(source, /Paddle provides all customer service inquiries and handles returns/);
  assert.match(source, /credits are internal usage units/i);
});

test("privacy and refund pages cover payment handling and digital delivery", () => {
  const privacy = read("app/privacy/page.tsx");
  const refund = read("app/refund/page.tsx");

  assert.match(privacy, /payment is processed by Paddle/i);
  assert.match(privacy, /we do not store full card numbers/i);
  assert.match(refund, /30 days/i);
  assert.match(refund, /digital product/i);
  assert.match(refund, /subscription/i);
});

test("public footers link to real policy URLs for Paddle review", () => {
  const home = read("app/page.tsx");
  const profileReview = read("app/dating-profile-review/page.tsx");

  for (const source of [home, profileReview]) {
    assert.match(source, /\/terms-and-conditions/);
    assert.match(source, /\/privacy/);
    assert.match(source, /\/refund/);
  }

  assert.doesNotMatch(home, /<a href="#">Terms<\/a>/);
  assert.doesNotMatch(home, /<a href="#">Privacy<\/a>/);
  assert.doesNotMatch(home, /<a href="#">Refund<\/a>/);
});
