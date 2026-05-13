import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("workspace sidebar is focused on the active DatingPhotosAI tools", () => {
  const sidebar = source("app/workspace/_components/workspace-sidebar.tsx");

  assert.match(sidebar, /DatingPhotosAI/);
  assert.match(sidebar, /AI 照片优化/);
  assert.doesNotMatch(sidebar, /AI Video|AI Image|Text to Image|Image to Image/);
  assert.doesNotMatch(sidebar, /Seedance|account@seedance\.ai/);
});

test("AI photo optimization page handles empty prompt and initial history errors", () => {
  const page = source("app/workspace/image-to-image/page.tsx");
  const generateRoute = source("app/api/generate/route.ts");

  assert.match(page, /DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT/);
  assert.match(generateRoute, /DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT/);
  assert.match(
    page,
    /const promptText = \(prompt \|\| ""\)\.trim\(\) \|\| DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;/
  );
  assert.doesNotMatch(page, /Prompt is required/);
  assert.doesNotMatch(generateRoute, /Prompt is required/);

  const start = page.indexOf("const fetchHistory = async");
  const end = page.indexOf("void fetchHistory(currentPage);", start);
  assert.ok(start >= 0 && end > start, "fetchHistory block should be present");
  const fetchHistoryBlock = page.slice(start, end);
  assert.doesNotMatch(fetchHistoryBlock, /showError\(/);
});

test("AI photo optimization settings are advanced options collapsed by default", () => {
  const page = source("app/workspace/image-to-image/page.tsx");

  assert.match(
    page,
    /showAdvancedOptions, setShowAdvancedOptions\] = useState\(false\)/
  );
  assert.match(page, /aria-expanded=\{showAdvancedOptions\}/);
  assert.match(page, /Advanced Options|高级选项/);
  assert.match(page, /\{showAdvancedOptions && \(/);
});

test("visible competitor product names are removed from public and workspace surfaces", () => {
  const files = [
    "app/layout.tsx",
    "app/page.tsx",
    "app/ai-photos/page.tsx",
    "app/blog/mock-posts.ts",
    "app/blog/page.tsx",
    "app/blog/[slug]/page.tsx",
    "app/dating-profile-review/checkout/[sessionId]/page.tsx",
    "app/dating-profile-review/_components/profile-review-report.tsx",
    "app/dating-profile-review/_components/profile-review-shell.tsx",
    "app/workspace/page.tsx",
    "app/workspace/my-creations/page.tsx",
    "app/workspace/pricing/page.tsx",
    "app/workspace/_components/workspace-sidebar.tsx",
    "lib/profile-review/email.ts",
    "lib/profile-review/steps.ts",
  ];

  for (const file of files) {
    const text = source(file);
    assert.doesNotMatch(text, /\bRoast\b|Roast AI Photos|ROAST Team|Seedance/);
  }
});
