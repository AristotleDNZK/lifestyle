import assert from "node:assert/strict";
import test from "node:test";

import { getNextDistDir } from "../next.config.shared.mjs";

test("getNextDistDir uses a separate folder for development", () => {
  assert.equal(getNextDistDir("development"), ".next-dev");
});

test("getNextDistDir keeps the production build folder unchanged", () => {
  assert.equal(getNextDistDir("production"), ".next");
});
