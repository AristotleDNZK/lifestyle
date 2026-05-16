import Image from "next/image";
import Link from "next/link";
import { ProfileReviewLogo } from "@/app/dating-profile-review/_components/profile-review-shell";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58 transition hover:text-[#d4d4d8]"
    >
      {children}
    </Link>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#d4d4d8] px-7 text-sm font-semibold uppercase tracking-[0.08em] text-[#111111] transition hover:bg-[#f1f1f1]"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-white/14 px-7 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:border-[#d4d4d8]/45 hover:bg-white/5"
    >
      {children}
    </Link>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-xl font-semibold uppercase tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function StepCard({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[#121212] p-6 ">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#151515] text-sm font-semibold uppercase tracking-[0.14em] text-[#d4d4d8]">
        {step}
      </div>
      <h3 className="mt-5 text-base font-semibold uppercase tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-7 text-white/62">{body}</p>
    </article>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#121212] p-6">
      <h3 className="text-lg font-bold text-white">{question}</h3>
      <p className="mt-3 text-sm leading-7 text-white/60">{answer}</p>
    </article>
  );
}

function ScoreCard({
  src,
  label,
  score,
  accent,
}: {
  src: string;
  label: string;
  score: number;
  accent: "red" | "green";
}) {
  const accentClasses =
    accent === "green"
      ? "border-[rgba(255,255,255,0.20)] bg-[#101712] text-[#d4d4d8]"
      : "border-white/15 bg-[#202020] text-[#e5e5e5]";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101010] p-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
        <Image src={src} alt={label} fill className="object-cover" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
          {label}
        </div>
        <div
          className={classes(
            "rounded-xl border px-3 py-2 text-base font-semibold",
            accentClasses
          )}
        >
          {score}
        </div>
      </div>
    </div>
  );
}

export default function DatingProfileReviewLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:54px_54px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_25%)]" />

      <div className="relative">
        <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.10)] bg-[#0b0b0c]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
            <ProfileReviewLogo />
            <nav className="hidden items-center gap-8 lg:flex">
              <NavLink href="/dating-profile-review">Dating Profile Review</NavLink>
              <NavLink href="/ai-photos">AI Dating Photos</NavLink>
              <NavLink href="/blog">Blog</NavLink>
            </nav>
            <PrimaryLink href="/dating-profile-review/quiz?fresh=1">
              Review my profile
            </PrimaryLink>
          </div>
        </header>

        <section className="px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#0d1510] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#d4d4d8]">
                Boost your match rate with better photos
              </div>
              <h1 className="mt-6 text-base font-semibold uppercase leading-tight text-white sm:text-xl xl:text-2xl">
                10x your dates with a dating profile review
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">
                Answer a fast quiz, upload your dating app photos, and get a score
                capped at 100 plus brutally specific fixes on what to keep, what to
                delete, and what to retake.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/dating-profile-review/quiz?fresh=1">
                  Review my profile
                </PrimaryLink>
                <SecondaryLink href="#how-it-works">
                  See how it works
                </SecondaryLink>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/42">
                <span>Private uploads</span>
                <span>Preview before unlock</span>
                <span>Report sent by email</span>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(10,13,11,0.96)_40%),linear-gradient(180deg,#0f1310,#090b09)] p-5  sm:p-8">
              <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                <ScoreCard
                  src="/homepage/hero-before.png"
                  label="Before"
                  score={23}
                  accent="red"
                />
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#151515] text-xl text-[#d4d4d8]">
                  {">"}
                </div>
                <ScoreCard
                  src="/homepage/hero-after.png"
                  label="After"
                  score={47}
                  accent="green"
                />
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-[#101010] p-5">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
                  What the report includes
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/68">
                  <li>Strict score capped at 100 with a weighted breakdown</li>
                  <li>Per-photo keep, drop, or retake decisions</li>
                  <li>Questionnaire-aware recommendations tied to your goal</li>
                  <li>Full report unlock, on-site access, and email delivery</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#d4d4d8] px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 md:grid-cols-4">
            {[
              ["464+", "Profiles reviewed"],
              ["7,246+", "Photo fixes generated"],
              ["94+", "Action items per report"],
              ["4.8/5", "Average satisfaction"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl font-semibold tracking-tight text-[#111111] sm:text-2xl">
                  {value}
                </div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title="Get your dating profile review in 3 steps"
              subtitle="The funnel follows the 1.png to 25.png reference flow: quiz, uploads, preview score, auth gate, mock payment, and unlocked report."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <StepCard
                step="01"
                title="Answer the quiz"
                body="We ask about gender, goals, frustrations, budget, and motivation so the scoring prompt can adapt to your actual dating situation."
              />
              <StepCard
                step="02"
                title="Upload your photos"
                body="Upload 1 to 9 private images. They are stored in a private Supabase bucket and passed into the scoring pipeline for observation."
              />
              <StepCard
                step="03"
                title="Unlock the action plan"
                body="See your preview score first, then register, complete the mock checkout, and unlock the full report on-site and by email."
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title="See the transformation"
              subtitle="The review focuses on first-photo impact, trust signals, visible style choices, and how well your photos match the type of connection you want."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                  <Image
                    src="/homepage/compare-before.png"
                    alt="Weak dating profile photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
                  Weak first impression
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/60">
                  <li>Bad crop and awkward posture</li>
                  <li>Weak lighting and low trust</li>
                  <li>No clear lifestyle positioning</li>
                </ul>
              </div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#151515] text-2xl text-[#d4d4d8]">
                {">"}
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[#121212] p-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                  <Image
                    src="/homepage/compare-after.png"
                    alt="Improved dating profile photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
                  Sharper dating signal
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/60">
                  <li>Cleaner eye contact and posture</li>
                  <li>Stronger style and background choice</li>
                  <li>Better alignment with dating goals</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <SectionTitle
              title="What you'll discover"
              subtitle="The report is built to be practical, not generic. It tells the user exactly what to fix and why."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                [
                  "Photo ranking",
                  "Best and worst photo identification plus ideal slot order for the profile carousel.",
                ],
                [
                  "Action plan",
                  "The highest-impact changes first, with direct rationale and success metrics.",
                ],
                [
                  "Retake blueprint",
                  "Camera angle, lighting, background, outfit, facial expression, and what to avoid.",
                ],
              ].map(([title, body]) => (
                <article
                  key={title}
                  className="rounded-xl border border-white/10 bg-[#121212] p-6"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[#151515] text-sm font-semibold uppercase tracking-[0.14em] text-[#d4d4d8]">
                    AI
                  </div>
                  <h3 className="mt-5 text-base font-semibold uppercase tracking-tight text-white">
                    {title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/62">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl rounded-xl border border-[rgba(255,255,255,0.10)] bg-[#121212] p-6 sm:p-8">
            <SectionTitle
              title="Clarity changes online dating results"
              subtitle="The full report turns vague dissatisfaction into a prioritized execution list."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["Top issues", "The 3 problems hurting your match rate most right now."],
                ["Quick wins", "The easiest changes with the highest expected return."],
                ["7-day sprint", "A practical order of operations for the next week."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-[#151515] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
                    Included
                  </div>
                  <div className="mt-3 text-xl font-bold text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/60">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <SectionTitle title="Frequently asked questions" />
            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              <FAQItem
                question="Do I need an account before I upload photos?"
                answer="No. Guests can complete the quiz, upload photos, and view the preview score. Registration is required only after the preview, before full report unlock."
              />
              <FAQItem
                question="Are the uploads public?"
                answer="No. The implementation stores photos in a private Supabase Storage bucket and only generates signed URLs for the report views."
              />
              <FAQItem
                question="What happens after I unlock?"
                answer="The mock payment route marks the order paid, unlocks the report on-site, and sends the full report to the user's email."
              />
              <FAQItem
                question="How does the score work?"
                answer="The score uses a strict weighted rubric and can never exceed 100. The prompt explicitly enforces the cap for every generated report."
              />
              <FAQItem
                question="How many photos can I upload?"
                answer="The default configuration supports 1 to 9 uploaded photos per review session."
              />
              <FAQItem
                question="What kind of advice will I get?"
                answer="You get per-photo strengths, weaknesses, retake instructions, order recommendations, bio angles, and a seven-day action plan."
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl rounded-xl border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,#111a13,#0a0f0b)] px-6 py-10 text-center  sm:px-12 sm:py-14">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d4d4d8]">
              Ready to be seen?
            </p>
            <h2 className="mt-3 text-xl font-semibold uppercase tracking-tight text-white sm:text-2xl">
              Review your profile now
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
              Start the full funnel from quiz to preview to unlock. The implementation
              is designed to be deployable on the existing Next.js stack.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryLink href="/dating-profile-review/quiz?fresh=1">
                Review my profile
              </PrimaryLink>
              <SecondaryLink href="/">Back to homepage</SecondaryLink>
            </div>
          </div>
        </section>

        <footer className="border-t border-[rgba(255,255,255,0.10)] bg-[#060906] px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <ProfileReviewLogo href="/" />
              <p className="mt-4 text-sm text-white/55">
                AI-powered dating optimization built for clearer first impressions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                Products
              </h3>
              <div className="mt-4 space-y-2 text-sm text-white/55">
                <div>Dating Profile Review</div>
                <div>AI Dating Photos</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                Resources
              </h3>
              <div className="mt-4 space-y-2 text-sm text-white/55">
                <div>Blog</div>
                <div>Support</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                Company
              </h3>
              <div className="mt-4 space-y-2 text-sm text-white/55">
                <Link className="block transition hover:text-white" href="/terms-and-conditions">
                  Terms
                </Link>
                <Link className="block transition hover:text-white" href="/privacy">
                  Privacy
                </Link>
                <Link className="block transition hover:text-white" href="/refund">
                  Refund policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
