import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const files = process.argv.slice(2);

function findTests(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...findTests(path));
    } else if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      found.push(path);
    }
  }

  return found;
}

const testFiles = files.length > 0 ? files : findTests("tests");

let failed = false;

for (const file of testFiles) {
  const result = spawnSync(process.execPath, [file], {
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
