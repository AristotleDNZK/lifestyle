import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("dev:3000 starts through a cleanup wrapper for stale port and chunks", () => {
  const packageJson = JSON.parse(source("package.json"));

  assert.equal(packageJson.scripts["dev:3000"], "node scripts/start-dev-server.mjs --port 3000");
  assert.ok(existsSync(path.join(process.cwd(), "scripts/start-dev-server.mjs")));

  const script = source("scripts/start-dev-server.mjs");
  assert.match(script, /Get-NetTCPConnection/);
  assert.match(script, /Stop-Process/);
  assert.match(script, /\.next-dev/);
  assert.match(script, /\.next/);
  assert.match(script, /removeDirectoryWithRetry/);
  assert.match(script, /ENOTEMPTY/);
  assert.match(script, /EPERM/);
  assert.match(script, /EBUSY/);
  assert.match(script, /await cleanNextDevCaches\(\)/);
  assert.doesNotMatch(script, /rmSync\(fullPath, \{ recursive: true, force: true \}\);\n\s*\}/);
  assert.match(script, /"next", "dist", "bin", "next"/);
  assert.match(script, /"dev", "--port", String\(port\)/);
  assert.match(script, /waitForReady/);
  assert.match(script, /\/_next\/static\/chunks\/app\/layout\.js/);
});
