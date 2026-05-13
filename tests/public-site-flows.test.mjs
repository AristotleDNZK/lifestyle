import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(filePath) {
  return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("global language switcher does not auto-load or auto-apply Google Translate", () => {
  const languageSwitcher = source("app/_components/global-language-switcher.tsx");

  assert.doesNotMatch(languageSwitcher, /usePathname/);
  assert.doesNotMatch(languageSwitcher, /triggerGoogleTranslate\(saved\)/);
  assert.match(languageSwitcher, /clearGoogTransCookie/);
  assert.match(languageSwitcher, /shouldLoadTranslateScript/);
});

test("public navigation uses real routes and removes the Reviews tab", () => {
  const home = source("app/page.tsx");
  const blog = source("app/blog/page.tsx");
  const profileReview = source("app/dating-profile-review/page.tsx");

  for (const page of [home, blog, profileReview]) {
    assert.doesNotMatch(page, /label:\s*"Reviews"/);
    assert.doesNotMatch(page, /href:\s*"#"/);
    assert.match(page, /AI Dating Photos/);
    assert.match(page, /\/ai-photos/);
    assert.match(page, /\/dating-profile-review/);
    assert.match(page, /\/blog/);
  }
});

test("blog keeps one clickable example article with a detail route", () => {
  const mockPosts = source("app/blog/mock-posts.ts");
  const blogPage = source("app/blog/page.tsx");

  assert.equal((mockPosts.match(/id:\s*"post-/g) || []).length, 1);
  assert.match(blogPage, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
  assert.ok(
    existsSync(path.join(process.cwd(), "app/blog/[slug]/page.tsx")),
    "blog detail route should exist"
  );
});

test("homepage AI Photos CTA enters the questionnaire funnel", () => {
  const home = source("app/page.tsx");
  const aiPhotos = source("app/ai-photos/page.tsx");

  assert.match(home, /href=\{?"\/ai-photos"\}?/);
  assert.match(aiPhotos, /@\/lib\/credit-packages/);
  assert.doesNotMatch(aiPhotos, /@\/lib\/stripe/);
  assert.match(aiPhotos, /CREDIT_PACKAGES/);
  assert.match(aiPhotos, /Question/);
  assert.match(aiPhotos, /Email/);
  assert.match(aiPhotos, /Upload/);
  assert.match(aiPhotos, /\/workspace\/pricing/);
});
