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
  const pricing = source("app/pricing/page.tsx");

  assert.match(home, /href=\{?"\/ai-photos"\}?/);
  assert.match(home, /Get my AI photos/);
  assert.match(home, /forceRedirectUrl="\/workspace\/image-to-image"/);
  assert.match(home, /href="\/workspace\/image-to-image"/);
  assert.doesNotMatch(home, /forceRedirectUrl="\/workspace"/);
  assert.doesNotMatch(home, /href="\/workspace"/);
  assert.match(aiPhotos, /@\/lib\/credit-packages/);
  assert.match(aiPhotos, /@clerk\/nextjs/);
  assert.match(aiPhotos, /SignInButton/);
  assert.match(aiPhotos, /SignUpButton/);
  assert.doesNotMatch(aiPhotos, /forceRedirectUrl="\/workspace"/);
  assert.doesNotMatch(aiPhotos, /href="\/workspace"/);
  assert.doesNotMatch(aiPhotos, /lifestyle-one|vercel\.app/);
  assert.doesNotMatch(aiPhotos, /@\/lib\/stripe/);
  assert.match(aiPhotos, /CREDIT_PACKAGES/);
  assert.match(aiPhotos, /Question/);
  assert.match(aiPhotos, /Email/);
  assert.match(aiPhotos, /Upload/);
  assert.match(aiPhotos, /\/pricing\?source=ai-photos&plan=/);
  assert.match(aiPhotos, /\/workspace\/image-to-image/);
  assert.match(aiPhotos, /forceRedirectUrl="\/workspace\/image-to-image"/);
  assert.match(pricing, /\/workspace\/image-to-image\?success=true&orderId=/);
  assert.match(pricing, /href="\/workspace\/image-to-image"/);
  assert.doesNotMatch(pricing, /\/dashboard/);
});

test("dating profile review keeps the original scoring funnel entry", () => {
  const profileReview = source("app/dating-profile-review/page.tsx");
  const quizPage = source("app/dating-profile-review/quiz/page.tsx");

  assert.match(profileReview, /Review my profile/);
  assert.match(profileReview, /href="\/dating-profile-review\/quiz\?fresh=1"/);
  assert.match(
    profileReview,
    /<PrimaryLink href="\/dating-profile-review\/quiz\?fresh=1">\s*Review my profile\s*<\/PrimaryLink>/
  );
  assert.doesNotMatch(
    profileReview,
    /<PrimaryLink href="\/ai-photos">\s*Get my AI photos\s*<\/PrimaryLink>/
  );
  assert.match(profileReview, /AI Dating Photos/);
  assert.match(profileReview, /href="\/ai-photos"/);
  assert.match(quizPage, /ProfileReviewQuizClient/);
});
