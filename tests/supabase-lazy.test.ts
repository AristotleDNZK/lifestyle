import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function runTsxSnippet(source: string) {
  const normalizedSource = source.replace(/\s+/g, " ").trim();
  const escapedSource = normalizedSource.replace(/"/g, '\\"');

  return spawnSync(`npx tsx -e "${escapedSource}"`, {
    cwd: workspaceRoot,
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
  });
}

test("importing lib/supabase does not fail when Supabase env vars are absent", () => {
  const result = runTsxSnippet(`
    (async () => {
      await import("./lib/supabase.ts");
      console.log("import-ok");
    })();
  `);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /import-ok/);
});

test("using supabaseAdmin without Supabase env vars fails with a descriptive error", () => {
  const result = runTsxSnippet(`
    (async () => {
      const module = await import("./lib/supabase.ts");
      const { supabaseAdmin } = "supabaseAdmin" in module ? module : module.default;

      try {
        supabaseAdmin.from("users");
        console.log("unexpected-success");
      } catch (error) {
        console.log(error instanceof Error ? error.message : String(error));
      }
    })();
  `);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /unexpected-success/);
  assert.match(
    result.stdout,
    /Missing Supabase environment variables for the admin client: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/
  );
});
