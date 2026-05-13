"use client";

import Image from "next/image";
import Link from "next/link";
import type {
  ProfileReviewFullReport,
  ProfileReviewPreviewReport,
} from "@/lib/profile-review/types";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type ProfileReviewReportImage = {
  id: string;
  signedUrl: string;
  sortOrder: number;
  analysisScore?: number | null;
  fileName?: string | null;
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm leading-6 text-white/72"
        >
          <span className="mt-2 h-2 w-2 rounded-full bg-[#63f276]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function findImage(images: ProfileReviewReportImage[], imageId: string | null) {
  if (!imageId) {
    return undefined;
  }

  return images.find((image) => image.id === imageId);
}

function ScoreChip({ score }: { score: number }) {
  return (
    <div className="text-center">
      <div className="text-[78px] font-black leading-none tracking-[-0.08em] text-white sm:text-[110px]">
        {score}
      </div>
      <div className="-mt-2 text-sm font-bold uppercase tracking-[0.22em] text-white/35">
        / 50
      </div>
    </div>
  );
}

function PreviewSection({
  report,
  images,
  unlockPriceUsd,
  onUnlock,
  unlockHref,
}: {
  report: ProfileReviewPreviewReport;
  images: ProfileReviewReportImage[];
  unlockPriceUsd?: number;
  onUnlock?: () => void;
  unlockHref?: string;
}) {
  const bestImage = findImage(images, report.bestPhotoId) || images[0];
  const buttonClass =
    "mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-sm bg-[#5cff68] px-6 text-sm font-black uppercase tracking-[0.08em] text-[#081009] transition hover:bg-[#79ff82]";
  const unlockLabel = `Unlock for $${unlockPriceUsd?.toFixed(2) || "3.99"}`;

  function renderUnlockCta(extraClassName?: string) {
    if (unlockHref) {
      return (
        <Link href={unlockHref} className={classes(buttonClass, extraClassName)}>
          {unlockLabel}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onUnlock}
        className={classes(buttonClass, extraClassName)}
      >
        {unlockLabel}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="sticky top-0 z-10 flex h-10 items-center justify-between bg-[#1f8b38] px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#081009]">
        <span>Discount ends in</span>
        <span>09 - 49 - 30</span>
      </div>

      <div className="mx-auto max-w-md px-4 pb-20 pt-8">
        <div className="text-center">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
            Your score
          </div>
          <ScoreChip score={report.overallScore} />
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#c2864d]">
            We have detected {report.topIssues.length} critical areas in your
            profile that are destroying your match rate.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white">
            Photos
          </h2>
          <div className="mt-4">
            <BulletList
              items={[
                "Your best and worst photo revealed",
                "The exact improvements to make",
                "Tailored tips to look more attractive",
              ]}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-[6px] border border-white/10 bg-[#111111]">
            <div className="relative aspect-[4/5] bg-[#111111]">
              {bestImage ? (
                <Image
                  src={bestImage.signedUrl}
                  alt={bestImage.fileName || "Best profile photo"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,242,118,0.16),rgba(12,12,12,0.96)_70%)]" />
              )}
              {typeof bestImage?.analysisScore === "number" ? (
                <div className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-xs font-bold text-white">
                  {bestImage.analysisScore}/50
                </div>
              ) : null}
            </div>
          </div>

          {renderUnlockCta()}
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white">
            Full report
          </h2>
          <div className="mt-4">
            <BulletList
              items={[
                "Unlimited feedback on your photos",
                "Quick wins to get results fast",
                "Step-by-step roadmap",
                "Exclusive algorithm hacks",
              ]}
            />
          </div>

          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-sm border border-white/8 bg-[#111111] px-4 py-4"
              >
                <div className="h-3 w-40 rounded-full bg-white/8" />
                <div className="text-white/25">LOCK</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-sm border border-[#1d3223] bg-[#0b140d] p-4">
            <p className="text-sm leading-6 text-white/72">
              Register and continue to payment to unlock the full report,
              detailed photo fixes, and delivery to your email.
            </p>
            {renderUnlockCta("mt-4")}
          </div>
        </section>

        <section className="mt-12 rounded-sm bg-[#111111] p-5">
          <div className="text-center text-sm font-semibold text-white/80">
            You're only getting
            <div className="text-[#63f276]">4% of your potential</div>
          </div>
          <div className="mt-6 flex items-end justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="h-3 w-16 rounded-full bg-white/80" />
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Alone
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-36 w-20 items-center justify-center rounded-md bg-[#5cff68] text-4xl font-black text-[#081009]">
                x10
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#63f276]">
                With DatingPhotosAI
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white">
            Maxx your profile
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Join 500,000+ successful daters
          </p>
          <div className="mt-5 space-y-3">
            {[
              "The feedback was detailed and actionable. My conversations improved in days.",
              "The analysis was honest and practical. I finally had photos that felt authentic.",
              "The full review opened my eyes to issues I was missing. Highly recommend it.",
            ].map((quote, index) => (
              <div
                key={quote}
                className="rounded-sm border border-white/8 bg-[#111111] p-4"
              >
                <div className="text-sm font-bold text-[#f6d05d]">
                  {"*".repeat(5)}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">{quote}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/38">
                  User {index + 1}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function ImageTile({
  image,
  badge,
  score,
}: {
  image?: ProfileReviewReportImage;
  badge?: string;
  score?: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0f0e]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#111]">
        {image ? (
          <Image
            src={image.signedUrl}
            alt={image.fileName || "Profile review photo"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,242,118,0.18),rgba(10,13,11,0.96)_70%)]" />
        )}
        {badge ? (
          <div className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#63f276]">
            {badge}
          </div>
        ) : null}
        {typeof score === "number" ? (
          <div className="absolute bottom-4 right-4 rounded-xl bg-[#63f276] px-3 py-2 text-lg font-black text-[#081009] shadow-[0_0_20px_rgba(99,242,118,0.32)]">
            {score}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricGrid({ scores }: { scores: ProfileReviewFullReport["dimensionScores"] }) {
  const items = [
    ["First photo impact", scores.firstPhotoImpact, 10],
    ["Trust and authenticity", scores.trustAndAuthenticity, 8],
    ["Appearance", scores.appearancePresentation, 8],
    ["Technique", scores.photoTechnique, 8],
    ["Lifestyle signals", scores.lifestyleSignals, 6],
    ["Variety", scores.varietyAndBalance, 4],
    ["Goal fit", scores.goalFit, 6],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, max]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-[#0d1110] p-4">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
            {label}
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <span className="text-4xl font-black tracking-[-0.05em] text-white">
              {value}
            </span>
            <span className="pb-1 text-sm text-white/50">/ {max}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionCards({
  items,
}: {
  items:
    | ProfileReviewFullReport["fullActionPlan"]
    | ProfileReviewFullReport["sevenDayActionPlan"];
}) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={`${item.priority}-${item.title}`}
          className="rounded-3xl border border-white/10 bg-[#0d1110] p-5 sm:p-6"
        >
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
            {item.priority} priority
          </div>
          <h4 className="mt-3 text-xl font-bold text-white">{item.title}</h4>
          <p className="mt-3 text-sm leading-6 text-white/62">{item.rationale}</p>
          <div className="mt-4 rounded-2xl border border-[#1f3323] bg-[#0a0f0d] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
              Action
            </div>
            <p className="mt-2 text-sm leading-6 text-white/75">{item.action}</p>
          </div>
          <div className="mt-4 text-sm font-semibold text-white/78">
            Success metric: {item.successMetric}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProfileReviewReport({
  variant,
  report,
  images,
  unlockHref,
  unlockPriceUsd,
  onUnlock,
}: {
  variant: "preview" | "full";
  report: ProfileReviewPreviewReport | ProfileReviewFullReport;
  images: ProfileReviewReportImage[];
  unlockHref?: string;
  unlockPriceUsd?: number;
  onUnlock?: () => void;
}) {
  if (variant === "preview") {
    return (
      <PreviewSection
        report={report as ProfileReviewPreviewReport}
        images={images}
        unlockHref={unlockHref}
        unlockPriceUsd={unlockPriceUsd}
        onUnlock={onUnlock}
      />
    );
  }

  const fullReport = report as ProfileReviewFullReport;
  const bestImage = findImage(images, fullReport.bestPhotoId);
  const worstImage = findImage(images, fullReport.worstPhotoId);

  return (
    <div className="min-h-screen bg-[#030303] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-[#223328] bg-[radial-gradient(circle_at_top,rgba(99,242,118,0.12),rgba(9,12,10,0.96)_28%),linear-gradient(180deg,#0d110f,#060806)] p-6 shadow-[0_0_48px_rgba(99,242,118,0.08)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#63f276]">
                Your profile report
              </div>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl">
                Full unlocked report
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/62 sm:text-lg">
                {fullReport.scoreSummary}
              </p>
            </div>

            <div className="inline-flex items-end gap-2 rounded-2xl border border-[#27412d] bg-[#0c1110] px-5 py-4 shadow-[0_0_28px_rgba(99,242,118,0.12)]">
              <span className="text-6xl font-black leading-none tracking-[-0.05em] text-white sm:text-7xl">
                {fullReport.overallScore}
              </span>
              <div className="pb-1">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#63f276]">
                  out of 50
                </div>
                <div className="mt-1 text-lg font-semibold text-white/75">
                  {fullReport.scoreLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6 sm:p-8">
              <SectionTitle
                title="Profile diagnosis"
                subtitle={fullReport.profileSummary}
              />
              <div className="mt-6">
                <BulletList items={fullReport.topIssues} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ImageTile
                image={bestImage}
                badge="Best current photo"
                score={bestImage?.analysisScore ?? null}
              />
              <ImageTile
                image={worstImage}
                badge="Biggest liability"
                score={worstImage?.analysisScore ?? null}
              />
            </div>
          </div>

          <div className="mt-10">
            <SectionTitle
              title="Highest-impact wins"
              subtitle="These are the changes with the fastest expected lift based on the uploaded photos and questionnaire context."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {fullReport.quickWins.map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-[#0d1110] p-5"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                    Quick win
                  </div>
                  <h4 className="mt-3 text-xl font-bold text-white">{item.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-white/60">{item.reason}</p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-white">
                    {item.action}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 space-y-12">
            <section>
              <SectionTitle
                title="Score breakdown"
                subtitle="The score stays capped at 50 and is allocated across the dimensions that most affect dating-app performance."
              />
              <div className="mt-6">
                <MetricGrid scores={fullReport.dimensionScores} />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6 sm:p-8">
                <SectionTitle title="Recommended photo order" />
                <div className="mt-6">
                  <BulletList items={fullReport.recommendedOrder} />
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6 sm:p-8">
                <SectionTitle title="Delete and retake list" />
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                      Delete
                    </div>
                    <BulletList items={fullReport.photosToDelete} />
                  </div>
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                      Retake
                    </div>
                    <BulletList items={fullReport.photosToRetake} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle
                title="Per-photo review"
                subtitle="Each uploaded image is assessed for first impression, visible strengths, weaknesses, and a detailed retake blueprint."
              />
              <div className="mt-6 grid gap-5">
                {fullReport.photoReviews.map((photoReview) => {
                  const image = images.find(
                    (item) => item.id === photoReview.imageId
                  );

                  return (
                    <article
                      key={photoReview.imageId}
                      className="grid gap-5 rounded-[30px] border border-white/10 bg-[#090d0b] p-5 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]"
                    >
                      <ImageTile
                        image={image}
                        badge={`${photoReview.keepOrDrop} | slot ${photoReview.idealSlotInProfile ?? "-"}`}
                        score={photoReview.imageScore}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                            {photoReview.quickLabel}
                          </h4>
                          <span className="rounded-full border border-[#203225] bg-[#101612] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                            Photo {photoReview.sortOrder}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-white/65">
                          {photoReview.firstImpression}
                        </p>
                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                          <div>
                            <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                              Strengths
                            </div>
                            <BulletList items={photoReview.strengths} />
                          </div>
                          <div>
                            <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                              Weaknesses
                            </div>
                            <BulletList items={photoReview.weaknesses} />
                          </div>
                        </div>
                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                          <div>
                            <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                              Clarity notes
                            </div>
                            <BulletList items={photoReview.clarityNotes} />
                          </div>
                          <div>
                            <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#63f276]">
                              Retake blueprint
                            </div>
                            <BulletList items={photoReview.retakeBlueprint} />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div>
                <SectionTitle
                  title="Full action plan"
                  subtitle="This is the ordered list of fixes with the biggest expected return on better matches and better dates."
                />
                <div className="mt-6">
                  <ActionCards items={fullReport.fullActionPlan} />
                </div>
              </div>
              <div>
                <SectionTitle
                  title="Seven-day sprint"
                  subtitle="Use this execution schedule if you want the fastest practical turnaround."
                />
                <div className="mt-6">
                  <ActionCards items={fullReport.sevenDayActionPlan} />
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6">
                <SectionTitle title="Bio angles" />
                <div className="mt-6">
                  <BulletList items={fullReport.bioSuggestions} />
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6">
                <SectionTitle title="Prompt ideas" />
                <div className="mt-6">
                  <BulletList items={fullReport.promptSuggestions} />
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-[#090d0b] p-6">
                <SectionTitle title="Confidence notes" />
                <div className="mt-6">
                  <BulletList items={fullReport.confidenceNotes} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
