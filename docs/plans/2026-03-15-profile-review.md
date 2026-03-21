# Profile Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a deployable dating profile review funnel with persisted step answers, private photo uploads, Gemini-powered scoring, a mock paid unlock, on-site report access, and email delivery.

**Architecture:** Add a configuration-driven funnel under dedicated dating profile review routes, back it with new Supabase tables and private storage, and generate reports asynchronously through Trigger.dev v4 tasks. Reuse Clerk for authentication, keep payment production-shaped through a mock order flow, and render both preview and full reports from structured JSON.

**Tech Stack:** Next.js App Router, React, Clerk, Supabase Postgres, Supabase Storage, Trigger.dev v4, Gemini API, Resend

---

### Task 1: Add database schema for profile reviews

**Files:**
- Create: `supabase/migrations/20260315_profile_review.sql`
- Modify: `lib/supabase.ts`
- Test: `supabase/migrations/20260315_profile_review.sql`

**Step 1: Write the failing test**

Define the expected schema additions in the migration:

- new review tables
- new indexes
- row update trigger if needed

**Step 2: Run test to verify it fails**

Run: `Get-Content 'supabase/migrations/20260315_profile_review.sql'`
Expected: file missing

**Step 3: Write minimal implementation**

Create the migration and extend `lib/supabase.ts` with TypeScript interfaces for the new records.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'supabase/migrations/20260315_profile_review.sql'`
Expected: SQL present with all required table definitions

**Step 5: Commit**

```bash
git add supabase/migrations/20260315_profile_review.sql lib/supabase.ts
git commit -m "feat: add profile review schema"
```

### Task 2: Add shared configuration and storage helpers

**Files:**
- Create: `lib/profile-review/config.ts`
- Create: `lib/profile-review/storage.ts`
- Create: `lib/profile-review/types.ts`
- Modify: `.env.local.example`
- Modify: `lib/env.ts`
- Test: `lib/profile-review/config.ts`

**Step 1: Write the failing test**

Define expected config accessors for:

- Gemini model ids
- unlock price
- storage bucket
- score cap

**Step 2: Run test to verify it fails**

Run: `Get-Content 'lib/profile-review/config.ts'`
Expected: file missing

**Step 3: Write minimal implementation**

Create configuration, typed report structures, and private Supabase Storage helper functions.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'lib/profile-review/config.ts'`
Expected: config exports and env parsing present

**Step 5: Commit**

```bash
git add lib/profile-review/config.ts lib/profile-review/storage.ts lib/profile-review/types.ts .env.local.example lib/env.ts
git commit -m "feat: add profile review config"
```

### Task 3: Define funnel step data and report rendering primitives

**Files:**
- Create: `lib/profile-review/steps.ts`
- Create: `app/dating-profile-review/_components/profile-review-shell.tsx`
- Create: `app/dating-profile-review/_components/profile-review-step-renderer.tsx`
- Create: `app/dating-profile-review/_components/profile-review-report.tsx`
- Test: `lib/profile-review/steps.ts`

**Step 1: Write the failing test**

Define a typed step configuration that covers the `1.png` to `25.png` sequence and includes:

- question steps
- message steps
- upload step
- email capture step
- preview report step
- unlock modal step

**Step 2: Run test to verify it fails**

Run: `Get-Content 'lib/profile-review/steps.ts'`
Expected: file missing

**Step 3: Write minimal implementation**

Create the step config and shared components for rendering the funnel and reports.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'lib/profile-review/steps.ts'`
Expected: all 25 steps defined in order

**Step 5: Commit**

```bash
git add lib/profile-review/steps.ts app/dating-profile-review/_components/profile-review-shell.tsx app/dating-profile-review/_components/profile-review-step-renderer.tsx app/dating-profile-review/_components/profile-review-report.tsx
git commit -m "feat: add profile review step system"
```

### Task 4: Implement session, answer, upload, status, and report APIs

**Files:**
- Create: `app/api/profile-review/session/route.ts`
- Create: `app/api/profile-review/session/[sessionId]/answer/route.ts`
- Create: `app/api/profile-review/session/[sessionId]/upload/route.ts`
- Create: `app/api/profile-review/session/[sessionId]/status/route.ts`
- Create: `app/api/profile-review/session/[sessionId]/report/route.ts`
- Create: `app/api/profile-review/session/[sessionId]/attach-user/route.ts`
- Modify: `lib/credits.ts` only if helper reuse is needed
- Test: `app/api/profile-review/session/route.ts`

**Step 1: Write the failing test**

Define API expectations:

- create session for guests
- save answers incrementally
- upload images privately
- expose status for polling
- gate full report unless order is paid

**Step 2: Run test to verify it fails**

Run: `Get-ChildItem 'app/api/profile-review' -Recurse -File`
Expected: no routes found

**Step 3: Write minimal implementation**

Add the new route handlers with validation and Supabase persistence.

**Step 4: Run test to verify it passes**

Run: `Get-ChildItem 'app/api/profile-review' -Recurse -File`
Expected: all route files present

**Step 5: Commit**

```bash
git add app/api/profile-review
git commit -m "feat: add profile review api routes"
```

### Task 5: Implement report prompt building and Gemini parsing

**Files:**
- Create: `lib/profile-review/prompt.ts`
- Create: `lib/profile-review/gemini.ts`
- Modify: `lib/profile-review/types.ts`
- Test: `lib/profile-review/prompt.ts`

**Step 1: Write the failing test**

Define prompt builders that:

- infer user needs from stored answers
- enforce score max 50
- demand highly specific recommendations
- produce a structured schema for preview and full report

**Step 2: Run test to verify it fails**

Run: `Get-Content 'lib/profile-review/prompt.ts'`
Expected: file missing

**Step 3: Write minimal implementation**

Create prompt assembly and Gemini response parsing utilities.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'lib/profile-review/prompt.ts'`
Expected: prompt builder includes score cap and answer-driven context

**Step 5: Commit**

```bash
git add lib/profile-review/prompt.ts lib/profile-review/gemini.ts lib/profile-review/types.ts
git commit -m "feat: add profile review model pipeline"
```

### Task 6: Add Trigger.dev v4 report generation task

**Files:**
- Modify: `trigger.config.ts`
- Create: `src/trigger/profile-review.ts`
- Modify: `app/api/profile-review/session/[sessionId]/upload/route.ts`
- Test: `src/trigger/profile-review.ts`

**Step 1: Write the failing test**

Define the async task contract:

- fetch session context
- sign image URLs
- call Gemini observation and report stages
- persist preview and full report
- update session status

**Step 2: Run test to verify it fails**

Run: `Get-Content 'src/trigger/profile-review.ts'`
Expected: file missing

**Step 3: Write minimal implementation**

Create a Trigger.dev v4 task and update config to v4-compatible imports.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'src/trigger/profile-review.ts'`
Expected: task definition present using `@trigger.dev/sdk`

**Step 5: Commit**

```bash
git add trigger.config.ts src/trigger/profile-review.ts app/api/profile-review/session/[sessionId]/upload/route.ts
git commit -m "feat: add async profile review generation task"
```

### Task 7: Add mock checkout and email delivery

**Files:**
- Create: `app/api/profile-review/session/[sessionId]/mock-checkout/route.ts`
- Create: `lib/profile-review/email.ts`
- Create: `app/dating-profile-review/unlock/[sessionId]/page.tsx`
- Test: `lib/profile-review/email.ts`

**Step 1: Write the failing test**

Define unlock behavior:

- require authenticated user
- create or update paid order
- mark session paid
- queue or send report email

**Step 2: Run test to verify it fails**

Run: `Get-Content 'lib/profile-review/email.ts'`
Expected: file missing

**Step 3: Write minimal implementation**

Create a Resend-backed mail helper and mock checkout route/page.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'lib/profile-review/email.ts'`
Expected: email send helper present

**Step 5: Commit**

```bash
git add app/api/profile-review/session/[sessionId]/mock-checkout/route.ts lib/profile-review/email.ts app/dating-profile-review/unlock/[sessionId]/page.tsx
git commit -m "feat: add mock checkout and report email delivery"
```

### Task 8: Build the review landing page and quiz UI

**Files:**
- Create: `app/dating-profile-review/page.tsx`
- Create: `app/dating-profile-review/quiz/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css` if global utility support is needed
- Test: `app/dating-profile-review/page.tsx`

**Step 1: Write the failing test**

Define UI expectations:

- homepage nav links to landing page
- landing page matches review reference styling
- quiz page renders step engine and persists progress

**Step 2: Run test to verify it fails**

Run: `Get-Content 'app/dating-profile-review/page.tsx'`
Expected: file missing

**Step 3: Write minimal implementation**

Create the landing page, quiz page, and homepage link wiring.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'app/dating-profile-review/page.tsx'`
Expected: landing page present and wired to quiz

**Step 5: Commit**

```bash
git add app/dating-profile-review/page.tsx app/dating-profile-review/quiz/page.tsx app/page.tsx app/globals.css
git commit -m "feat: add profile review frontend flow"
```

### Task 9: Add authenticated full report page and gating

**Files:**
- Create: `app/dating-profile-review/report/[sessionId]/page.tsx`
- Modify: `app/dating-profile-review/_components/profile-review-report.tsx`
- Modify: `app/api/profile-review/session/[sessionId]/report/route.ts`
- Test: `app/dating-profile-review/report/[sessionId]/page.tsx`

**Step 1: Write the failing test**

Define report page behavior:

- preview available pre-payment
- full report only after paid order
- authenticated owner can view unlocked report on-site

**Step 2: Run test to verify it fails**

Run: `Get-Content 'app/dating-profile-review/report/[sessionId]/page.tsx'`
Expected: file missing

**Step 3: Write minimal implementation**

Create the report page and enforce paid access.

**Step 4: Run test to verify it passes**

Run: `Get-Content 'app/dating-profile-review/report/[sessionId]/page.tsx'`
Expected: gated full report page present

**Step 5: Commit**

```bash
git add app/dating-profile-review/report/[sessionId]/page.tsx app/dating-profile-review/_components/profile-review-report.tsx app/api/profile-review/session/[sessionId]/report/route.ts
git commit -m "feat: add unlocked profile review report page"
```

### Task 10: Verify deployability and docs

**Files:**
- Modify: `.env.local.example`
- Modify: `README.md` or add a short deployment note if needed
- Test: full project verification

**Step 1: Write the failing test**

Define final verification:

- lint clean or report blockers
- build succeeds
- new environment variables documented

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: failures until prior tasks are implemented

**Step 3: Write minimal implementation**

Patch any remaining issues, document setup, and remove dead references.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: successful production build

**Step 5: Commit**

```bash
git add .env.local.example README.md
git commit -m "docs: finalize profile review deployment notes"
```
