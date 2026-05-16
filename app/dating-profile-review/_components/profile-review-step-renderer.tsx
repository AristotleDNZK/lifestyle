"use client";

import Image from "next/image";
import { useId } from "react";
import type { ProfileReviewStep } from "@/lib/profile-review/steps";
import type {
  ProfileReviewPreviewReport,
  StepOption,
} from "@/lib/profile-review/types";
import {
  ProfileReviewReport,
  type ProfileReviewReportImage,
} from "@/app/dating-profile-review/_components/profile-review-report";
import {
  ProfileReviewPrimaryButton,
  ProfileReviewSecondaryButton,
  ProfileReviewShell,
} from "@/app/dating-profile-review/_components/profile-review-shell";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type UploadPreview = {
  id: string;
  previewUrl: string;
  name: string;
};

function optionToken(option: StepOption, index: number) {
  const lookup: Record<string, string> = {
    man: "M",
    woman: "W",
    women: "W",
    men: "M",
    both: "B",
    relationship: "R",
    fun: "F",
    open_connection: "O",
    texting: "T",
    no_limit: "$$",
    medium: "$",
    lean: "L",
  };

  return lookup[option.value] || option.label.slice(0, 2).toUpperCase();
}

function OptionButton({
  option,
  index,
  onClick,
  disabled,
}: {
  option: StepOption;
  index: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes(
        "flex min-h-[76px] w-full items-center gap-4 rounded-lg border border-white/6 bg-[#121212] px-5 text-left text-white transition",
        "hover:border-[#d4d4d8]/35 hover:bg-[#171817] disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/40 text-sm font-semibold uppercase tracking-[0.1em] text-[#d4d4d8]">
        {optionToken(option, index)}
      </span>
      <span className="text-base font-medium sm:text-lg">{option.label}</span>
    </button>
  );
}

function TestimonialCard({
  quote,
  author,
}: {
  quote: string;
  author: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#15181c] p-4 text-left">
      <div className="text-[#f8d05a]">{"*****"}</div>
      <p className="mt-3 text-sm leading-6 text-white/65">{quote}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-white/45">
        {author}
      </p>
    </article>
  );
}

export function ProfileReviewStepRenderer({
  step,
  canGoBack,
  onBack,
  busy,
  sessionReady,
  sessionNotice,
  onRetryInitialization,
  emailValue,
  onEmailChange,
  onChoice,
  onContinue,
  onUploadIntroChoice,
  uploadPreviews,
  onUploadFiles,
  onRemoveUpload,
  onSubmitUploads,
  analysisProgress,
  previewReport,
  previewImages,
  onUnlockReport,
  unlockPriceUsd,
}: {
  step: ProfileReviewStep;
  canGoBack: boolean;
  onBack: () => void;
  busy?: boolean;
  sessionReady: boolean;
  sessionNotice?: string | null;
  onRetryInitialization: () => void;
  emailValue: string;
  onEmailChange: (value: string) => void;
  onChoice: (option: StepOption) => void;
  onContinue: () => void;
  onUploadIntroChoice: (source: "upload") => void;
  uploadPreviews: UploadPreview[];
  onUploadFiles: (files: FileList | null) => void;
  onRemoveUpload: (id: string) => void;
  onSubmitUploads: () => void;
  analysisProgress: number;
  previewReport?: ProfileReviewPreviewReport | null;
  previewImages: ProfileReviewReportImage[];
  onUnlockReport: () => void;
  unlockPriceUsd: number;
}) {
  const fileInputId = useId();
  const interactionDisabled = busy || !sessionReady;
  const notice = sessionNotice ? (
    <div className="pt-4 text-center">
      <p className="text-sm text-white/45">{sessionNotice}</p>
      {!sessionReady ? (
        <button
          type="button"
          onClick={onRetryInitialization}
          className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  ) : null;

  if (step.type === "preview") {
    if (!previewReport) {
      return (
        <ProfileReviewShell
          theme="black"
          title="Building your score"
          subtitle="The preview report is still loading."
        >
          <div className="rounded-xl border border-white/10 bg-[#121212] p-8 text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#d4d4d8]" />
            <p className="mt-5 text-base text-white/65">
              Your preview report is being loaded.
            </p>
          </div>
        </ProfileReviewShell>
      );
    }

    return (
      <ProfileReviewReport
        variant="preview"
        report={previewReport}
        images={previewImages}
        unlockPriceUsd={unlockPriceUsd}
        onUnlock={onUnlockReport}
      />
    );
  }

  if (step.type === "choice") {
    return (
      <ProfileReviewShell
        theme={step.theme || "black"}
        progress={step.progress}
        showBack={canGoBack}
        onBack={onBack}
        heroTitle={step.id === 1 ? "Double your matches in 60 seconds" : undefined}
        heroSubtitle={step.id === 1 ? "Take this 1-minute quiz" : undefined}
        title={step.question}
      >
        <div className="space-y-3">
          {step.options.map((option, index) => (
            <OptionButton
              key={option.value}
              option={option}
              index={index}
              onClick={() => onChoice(option)}
              disabled={interactionDisabled}
            />
          ))}
          {notice}
        </div>
      </ProfileReviewShell>
    );
  }

  if (step.type === "message") {
    return (
      <ProfileReviewShell
        theme={step.theme || "green"}
        progress={step.progress}
        showBack={canGoBack}
        onBack={onBack}
        title={step.title}
        subtitle={step.body}
        footer={
          <div className="mx-auto max-w-md">
            <ProfileReviewPrimaryButton
              onClick={onContinue}
              disabled={interactionDisabled}
            >
              {step.cta}
            </ProfileReviewPrimaryButton>
          </div>
        }
      >
        <div className="flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-black/15 text-xl font-semibold text-[#f1e7de] ">
            {String(step.id).padStart(2, "0")}
          </div>
        </div>
      </ProfileReviewShell>
    );
  }

  if (step.type === "upload-intro") {
    return (
      <ProfileReviewShell
        progress={step.progress}
        showBack={canGoBack}
        onBack={onBack}
        title={step.title}
        subtitle={step.body}
      >
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-white/10 bg-[#121212] p-5 text-center">
            <div className="mx-auto max-w-[180px] rounded-xl border border-white/10 bg-[#151515] p-3 ">
              <div className="rounded-lg bg-[#0e1113] p-3">
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1b1b1b]">
                  Your profile is super{" "}
                  <span className="text-[#ff875c]">weak</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="aspect-square rounded-md bg-white/10" />
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="flex aspect-square items-center justify-center rounded-md border border-dashed border-white/20 bg-white/[0.03] text-xl text-white/35"
                    >
                      +
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-white/55">
            Your photos are 100% private and only used for this review.
          </p>
          <div className="mt-5 space-y-3">
            <ProfileReviewPrimaryButton
              onClick={() => onUploadIntroChoice("upload")}
              disabled={interactionDisabled}
            >
              Upload photos
            </ProfileReviewPrimaryButton>
          </div>
          {notice}
        </div>
      </ProfileReviewShell>
    );
  }

  if (step.type === "upload") {
    return (
      <ProfileReviewShell
        progress={step.progress}
        showBack={canGoBack}
        onBack={onBack}
        title={step.title}
        subtitle={step.body}
        footer={
          <div className="mx-auto max-w-md">
            <ProfileReviewPrimaryButton
              onClick={onSubmitUploads}
              disabled={interactionDisabled || uploadPreviews.length === 0}
            >
              {busy ? "Analyzing..." : "Analyze it"}
            </ProfileReviewPrimaryButton>
          </div>
        }
      >
        <div className="space-y-6">
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => onUploadFiles(event.target.files)}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {uploadPreviews.map((file) => (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={file.previewUrl}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveUpload(file.id)}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg text-white transition hover:bg-black"
                  aria-label={`Remove ${file.name}`}
                >
                  x
                </button>
              </div>
            ))}

            {uploadPreviews.length < 9 ? (
              <label
                htmlFor={fileInputId}
                className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/16 bg-white/[0.03] text-center text-white/55 transition hover:border-[#d4d4d8]/45 hover:bg-white/[0.05]"
              >
                <span className="text-xl font-light text-[#d4d4d8]">+</span>
                <span className="mt-2 text-sm font-semibold uppercase tracking-[0.12em]">
                  Upload
                </span>
              </label>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121212] p-5">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#d4d4d8]">
              Best results checklist
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <li>Use 1 to 9 recent photos with different outfits, angles, and backgrounds.</li>
              <li>Avoid screenshots, heavy filters, mirror selfies, and low-light bathroom shots.</li>
              <li>Mix one strong headshot, one full-body shot, one lifestyle shot, and one social-context shot.</li>
            </ul>
          </div>
          {notice}
        </div>
      </ProfileReviewShell>
    );
  }

  if (step.type === "analysis") {
    return (
      <ProfileReviewShell progress={step.progress} title={step.title} subtitle={step.body}>
        <div className="space-y-10">
          <div className="flex justify-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-[#121212]">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#d4d4d8 ${analysisProgress * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
                }}
              />
              <div className="absolute inset-[12px] rounded-full bg-[#0b0b0c]" />
              <div className="relative text-center">
                <div className="text-xl font-semibold text-white">{analysisProgress}%</div>
                <div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/45">
                  Analyzing
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <TestimonialCard
              quote="The photo review opened my eyes to details I kept missing. The fixes were specific and immediately usable."
              author="David K."
            />
            <TestimonialCard
              quote="The prompt suggestions and photo ordering advice were far more practical than generic dating tips."
              author="Ryan S."
            />
          </div>
          {notice}
        </div>
      </ProfileReviewShell>
    );
  }

  if (step.type === "email") {
    return (
      <ProfileReviewShell progress={step.progress} title={step.title} subtitle={step.body}>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border-b border-white/20 px-2 pb-3">
            <input
              type="email"
              value={emailValue}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Email"
              className="w-full bg-transparent text-center text-2xl text-white outline-none placeholder:text-white/35"
            />
          </div>
          <div className="mt-5">
            <ProfileReviewPrimaryButton onClick={onContinue} disabled={interactionDisabled}>
              {busy ? "Saving..." : step.cta}
            </ProfileReviewPrimaryButton>
          </div>
          <p className="mt-5 text-center text-sm text-white/58">
            We only use your email to send your review, payment receipt, and follow-up optimization tips.
          </p>

          <div className="mt-20 text-center">
            <div className="text-xl text-white/85">{"*****"}</div>
            <p className="mt-2 text-lg font-semibold text-white/80">50k+ happy clients</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[3/4] rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))]"
                />
              ))}
            </div>
          </div>
          {notice}
        </div>
      </ProfileReviewShell>
    );
  }

  return null;
}
