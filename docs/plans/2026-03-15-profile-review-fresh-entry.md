# Profile Review Fresh Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make photo review public entry points always start a new session from step 1 instead of restoring an old preview/report session.

**Architecture:** Add a small client-side helper that resolves whether the quiz should ignore stored session state based on URL parameters, then wire all public funnel CTAs to pass `fresh=1`. Keep explicit deep links and in-flow navigation unchanged.

**Tech Stack:** Next.js App Router, React client components, TypeScript, node:test, tsx

---

### Task 1: Add session resolution regression tests

**Files:**
- Create: `E:/AIProgram/video_generator/tests/profile-review/client-entry.test.ts`
- Create: `E:/AIProgram/video_generator/lib/profile-review/client-entry.ts`

**Step 1: Write the failing test**

Cover these cases:

- `fresh=1` ignores stored session and forces new session creation
- explicit URL `sessionId/accessToken` still wins
- stored session is used only when fresh mode is not requested

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profile-review/client-entry.test.ts`

Expected: FAIL because the helper module does not exist yet.

**Step 3: Write minimal implementation**

Implement helper functions for:

- detecting fresh entry from search params
- resolving whether initialization should use URL params, stored session, or create a new session

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/profile-review/client-entry.test.ts`

Expected: PASS

### Task 2: Wire quiz initialization to fresh-entry behavior

**Files:**
- Modify: `E:/AIProgram/video_generator/app/dating-profile-review/_components/profile-review-quiz-client.tsx`

**Step 1: Write the failing test**

Reuse the helper-based regression coverage from Task 1. Do not add component-level test scaffolding unless the helper is insufficient.

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profile-review/client-entry.test.ts`

Expected: Existing failing case proves the bug.

**Step 3: Write minimal implementation**

Update initialization to:

- read `fresh`
- clear local storage when `fresh=1`
- skip stored-session reuse in fresh mode
- create a new session and start from backend step 1

Keep existing sync logic for current in-progress session.

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/profile-review/client-entry.test.ts`

Expected: PASS

### Task 3: Update public entry points to launch fresh sessions

**Files:**
- Modify: `E:/AIProgram/video_generator/app/dating-profile-review/page.tsx`
- Modify any additional public CTA files that link directly to `/dating-profile-review/quiz`

**Step 1: Write the failing test**

Use repo search to identify all public quiz entry links and verify they currently omit `fresh=1`.

**Step 2: Run minimal verification**

Run: `Select-String -Path 'E:/AIProgram/video_generator/app/**/*.tsx' -Pattern '/dating-profile-review/quiz'`

Expected: Results show current direct quiz links.

**Step 3: Write minimal implementation**

Append `?fresh=1` to public entry-point quiz links while leaving internal step/report/unlock links untouched.

**Step 4: Run verification**

Run the same search and manually inspect affected files.

Expected: Public entry links include `fresh=1`.

### Task 4: Full verification

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run: `npx tsx --test tests/profile-review/client-entry.test.ts tests/profile-review/gemini-rest.test.ts`

Expected: PASS

**Step 2: Run production build**

Run: `npm run build`

Expected: PASS

**Step 3: Manual behavior check**

Manually verify:

- entering from landing/home creates a new session
- internal next/back keeps the same session
- leaving and re-entering from public entry starts a new session
