"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { useMemo, useRef, useState } from "react";
import { CREDIT_PACKAGES, type PackageType } from "@/lib/credit-packages";
import { compressImageToDataUrl } from "@/lib/client-image-compression";
import {
  LOCAL_DEV_WORKSPACE_LOGIN_URL,
  isLocalDevAuthEnabled,
} from "@/lib/local-dev-auth-shared";

type FunnelStep = "question" | "email" | "upload" | "plan";

type Question = {
  id: string;
  title: string;
  options: string[];
};

const questions: Question[] = [
  {
    id: "gender",
    title: "Ready to get your new AI pictures?",
    options: ["Man", "Woman"],
  },
  {
    id: "goal",
    title: "What do you want your new dating photos to do?",
    options: ["Get more matches", "Look more confident", "Replace weak selfies", "Create a complete profile set"],
  },
  {
    id: "style",
    title: "Which style fits you best?",
    options: ["Natural lifestyle", "Polished professional", "Night out", "Outdoor adventure"],
  },
];

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>;
}

function PublicHeader() {
  const navItems = [
    { label: "Dating Profile Review", href: "/dating-profile-review" },
    { label: "AI Dating Photos", href: "/ai-photos" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0c]/92 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5]/25 bg-[#151515] px-3 py-1.5">
            <span className="font-semibold tracking-tight text-[#f6fbf7]">
              DatingPhotosAI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === "/ai-photos" ? "text-white" : "transition-colors hover:text-[#d4d4d8]" }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#e5e5e5]/45 hover:bg-white/[0.06] sm:inline-flex"
            >
              Resources
            </Link>

            <SignedOut>
              {isLocalDevAuthEnabled() ? (
                <>
                  <Link
                    href={LOCAL_DEV_WORKSPACE_LOGIN_URL}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#e5e5e5]/45 hover:bg-white/[0.06]"
                  >
                    Log in
                  </Link>
                  <Link
                    href={LOCAL_DEV_WORKSPACE_LOGIN_URL}
                    className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#f1f1f1]"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  <SignInButton mode="modal" forceRedirectUrl="/workspace/image-to-image">
                    <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#e5e5e5]/45 hover:bg-white/[0.06]">
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/workspace/image-to-image">
                    <button className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#f1f1f1]">
                      Sign up
                    </button>
                  </SignUpButton>
                </>
              )}
            </SignedOut>

            <SignedIn>
              <Link
                href="/workspace/image-to-image"
                className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#f1f1f1]"
              >
                Enter workspace
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </Container>
    </header>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${active || done ? "bg-[#d4d4d8]" : "bg-white/18"}`} />
      <span className={active ? "text-white" : done ? "text-[#d4d4d8]" : "text-white/42"}>{label}</span>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#e5e5e5] px-6 text-sm font-semibold tracking-tight text-[#0b0d10] transition hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:bg-[#2a2a2a] disabled:text-white/35"
    >
      {children}
    </button>
  );
}

function PlanCard({
  packageType,
  selected,
  onSelect,
}: {
  packageType: PackageType;
  selected: boolean;
  onSelect: () => void;
}) {
  const plan = CREDIT_PACKAGES[packageType];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#d4d4d8]/55 bg-[#121212]"
          : "border-white/10 bg-[#121212] hover:border-[#d4d4d8]/35"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{plan.name}</h3>
          <p className="mt-1 text-sm text-white/50">{plan.description}</p>
        </div>
        {plan.popular ? (
          <span className="rounded-full bg-[#d4d4d8] px-2 py-1 text-[10px] font-semibold uppercase text-[#071009]">
            Popular
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-xl font-semibold tracking-tight text-[#d4d4d8]">
        {plan.priceFormatted}
      </p>
      <p className="mt-2 text-sm text-white/50">{plan.credits} credits for AI photo generation</p>
    </button>
  );
}

export default function AiPhotosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<FunnelStep>("question");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PackageType>("popular");
  const [handoffBusy, setHandoffBusy] = useState(false);

  const currentQuestion = questions[questionIndex] || questions[0];
  const questionDone = step !== "question";
  const emailDone = step === "upload" || step === "plan";
  const uploadDone = step === "plan";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const previewImages = useMemo(
    () => files.slice(0, 4).map((file) => URL.createObjectURL(file)),
    [files]
  );

  const persistWorkspaceHandoff = async () => {
    if (typeof window === "undefined") return;

    const storedImages = await Promise.all(
      files.slice(0, 5).map(
        async (file) => ({
          id: `ai-photos-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          dataUrl: await compressImageToDataUrl(file),
        })
      )
    );

    const answerSummary = questions
      .map((question) => {
        const answer = answers[question.id];
        return answer ? `${question.title}: ${answer}` : "";
      })
      .filter(Boolean)
      .join("\n");

    window.sessionStorage.setItem("i2i_uploadedImages", JSON.stringify(storedImages));
    window.sessionStorage.setItem(
      "i2i_prompt",
      JSON.stringify(
        [
          "Create a polished dating profile photo set using these user preferences.",
          answerSummary,
          email.trim() ? `Contact email: ${email.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      )
    );
    window.sessionStorage.setItem("i2i_tab", JSON.stringify("examples"));
  };

  const chooseAnswer = (answer: string) => {
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: answer,
    };
    setAnswers(nextAnswers);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    setStep("email");
  };

  const continueToUpload = () => {
    if (!validEmail) return;
    setStep("upload");
  };

  const continueToPlans = () => {
    if (!files.length) return;
    setStep("plan");
  };

  const handleChoosePurchasePlan = async () => {
    if (handoffBusy) return;

    try {
      setHandoffBusy(true);
      await persistWorkspaceHandoff();
      router.push(`/pricing?source=ai-photos&plan=${selectedPlan}`);
    } finally {
      setHandoffBusy(false);
    }
  };

  const handleContinueToWorkspace = async (
    destination = "/workspace/image-to-image"
  ) => {
    if (handoffBusy) return;

    try {
      setHandoffBusy(true);
      await persistWorkspaceHandoff();
      if (destination === LOCAL_DEV_WORKSPACE_LOGIN_URL) {
        router.push(LOCAL_DEV_WORKSPACE_LOGIN_URL);
        return;
      }
      router.push(destination);
    } finally {
      setHandoffBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-white">
      <PublicHeader />

      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="inline-flex rounded-full border border-[#e5e5e5]/25 bg-[#151515] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d4d4d8]">
                AI Dating Photos
              </p>
              <h1 className="mt-5 max-w-xl text-base font-semibold leading-[0.95] tracking-tight sm:text-2xl">
                Get better dating photos in one flow
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/58 sm:text-xl">
                Answer a quick questionnaire, leave your email, upload photos, choose a plan, and continue in the workspace.
              </p>

              <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="relative h-64 overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
                  <Image src="/homepage/hero-before.png" alt="Before dating photo" fill className="object-cover" />
                  <span className="absolute bottom-3 right-3 rounded-lg border border-[#df4747] bg-[#301919] px-2 py-1 text-lg font-semibold text-[#ea4b4b]">
                    31
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#151515] text-xl font-semibold text-[#e5e5e5]">
                  &gt;&gt;
                </div>
                <div className="relative h-64 overflow-hidden rounded-xl border border-[#a1a1aa]/40 ">
                  <Image src="/homepage/hero-after.png" alt="After dating photo" fill className="object-cover" />
                  <span className="absolute bottom-3 right-3 rounded-lg border border-[#a1a1aa] bg-[#202020] px-2 py-1 text-lg font-semibold text-[#d4d4d8]">
                    87
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121212] p-5  sm:p-7">
              <div className="flex flex-wrap gap-x-5 gap-y-3 border-b border-white/10 pb-5">
                <StepPill label="Question" active={step === "question"} done={questionDone} />
                <StepPill label="Email" active={step === "email"} done={emailDone} />
                <StepPill label="Upload" active={step === "upload"} done={uploadDone} />
                <StepPill label="Plan" active={step === "plan"} done={false} />
              </div>

              {step === "question" ? (
                <div className="pt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">
                    Question {questionIndex + 1} of {questions.length}
                  </p>
                  <h2 className="mt-3 text-base font-semibold leading-tight tracking-tight">{currentQuestion.title}</h2>
                  <div className="mt-6 grid gap-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => chooseAnswer(option)}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-left text-base text-white/78 transition hover:border-[#d4d4d8]/45 hover:bg-[#1b1b1c]"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "email" ? (
                <div className="pt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">Email</p>
                  <h2 className="mt-3 text-base font-semibold leading-tight tracking-tight">Where should we keep your photo plan?</h2>
                  <p className="mt-3 text-white/58">Use the same email when you enter the workspace.</p>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="mt-6 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition focus:border-[#d4d4d8]/70"
                  />
                  <div className="mt-5">
                    <PrimaryButton onClick={continueToUpload} disabled={!validEmail}>
                      Continue to upload
                    </PrimaryButton>
                  </div>
                </div>
              ) : null}

              {step === "upload" ? (
                <div className="pt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">Upload</p>
                  <h2 className="mt-3 text-base font-semibold leading-tight tracking-tight">Upload your starting photos</h2>
                  <p className="mt-3 text-white/58">Use 4-10 clear selfies or existing profile photos for best output.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 flex min-h-[170px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#d4d4d8]/35 bg-black/25 px-5 text-center transition hover:bg-[#1b1b1c]"
                  >
                    <span className="text-lg font-semibold">Select photos</span>
                    <span className="mt-2 text-sm text-white/45">JPG, PNG, or WebP</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => setFiles(Array.from(event.target.files || []))}
                  />
                  {files.length ? (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {previewImages.map((src, index) => (
                        <div key={src} className="relative h-20 overflow-hidden rounded-md border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-5">
                    <PrimaryButton onClick={continueToPlans} disabled={!files.length}>
                      Choose purchase plan
                    </PrimaryButton>
                  </div>
                </div>
              ) : null}

              {step === "plan" ? (
                <div className="pt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">Purchase Plan</p>
                  <h2 className="mt-3 text-base font-semibold leading-tight tracking-tight">Choose the same plan used across the site</h2>
                  <p className="mt-3 text-white/58">
                    This uses the same purchase plans as the main pricing page. After buying credits, continue to the workspace and generate manually.
                  </p>
                  <div className="mt-6 grid gap-3">
                    {(Object.keys(CREDIT_PACKAGES) as PackageType[]).map((packageType) => (
                      <PlanCard
                        key={packageType}
                        packageType={packageType}
                        selected={selectedPlan === packageType}
                        onSelect={() => setSelectedPlan(packageType)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleChoosePurchasePlan();
                    }}
                    disabled={handoffBusy}
                    className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#e5e5e5] px-6 text-sm font-semibold tracking-tight text-[#0b0d10] transition hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {handoffBusy ? "Preparing workspace..." : "Choose purchase plan"}
                  </button>
                  <SignedOut>
                    {isLocalDevAuthEnabled() ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleContinueToWorkspace(
                            LOCAL_DEV_WORKSPACE_LOGIN_URL
                          );
                        }}
                        disabled={handoffBusy}
                        className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl border border-white/14 px-6 text-sm font-semibold tracking-tight text-white transition hover:border-[#d4d4d8]/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {handoffBusy ? "Preparing workspace..." : "Continue to workspace"}
                      </button>
                    ) : (
                      <SignUpButton
                        mode="modal"
                        forceRedirectUrl="/workspace/image-to-image"
                      >
                          <button
                            type="button"
                            onClick={() => {
                              void persistWorkspaceHandoff();
                            }}
                            className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl border border-white/14 px-6 text-sm font-semibold tracking-tight text-white transition hover:border-[#d4d4d8]/60 hover:bg-white/5"
                          >
                          Continue to workspace
                        </button>
                      </SignUpButton>
                    )}
                  </SignedOut>
                  <SignedIn>
                    <button
                      type="button"
                      onClick={() => {
                        void handleContinueToWorkspace();
                      }}
                      disabled={handoffBusy}
                      className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl border border-white/14 px-6 text-sm font-semibold tracking-tight text-white transition hover:border-[#d4d4d8]/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {handoffBusy ? "Preparing workspace..." : "Continue to workspace"}
                    </button>
                  </SignedIn>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
