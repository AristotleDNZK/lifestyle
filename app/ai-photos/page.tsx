"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CREDIT_PACKAGES, type PackageType } from "@/lib/credit-packages";

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
    <header className="sticky top-0 z-40 border-b border-[#20432f]/70 bg-[#0e1014]/88 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex -skew-x-12 bg-[#5ef36f] px-3 py-1">
            <span className="skew-x-12 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl uppercase tracking-[0.05em] text-[#111]">
              DatingPhotosAI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] text-white/65 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === "/ai-photos" ? "text-white" : "transition-colors hover:text-[#63f276]"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/blog"
            className="rounded-sm border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#57f06d]/50"
          >
            Resources
          </Link>
        </div>
      </Container>
    </header>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active || done ? "bg-[#63f276]" : "bg-white/18"
        }`}
      />
      <span className={active ? "text-white" : done ? "text-[#9cf7aa]" : "text-white/42"}>{label}</span>
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
      className="inline-flex min-h-[48px] items-center justify-center rounded-sm bg-[#5ef36f] px-6 text-sm font-black uppercase tracking-[0.06em] text-[#0b0d10] transition hover:bg-[#78ff88] disabled:cursor-not-allowed disabled:bg-[#2a5032] disabled:text-white/35"
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
      className={`text-left transition ${
        selected
          ? "border-[#63f276] bg-[#183523] shadow-[0_0_26px_rgba(94,243,111,0.2)]"
          : "border-white/10 bg-[#10151b] hover:border-[#63f276]/50"
      } rounded-md border p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <p className="mt-1 text-sm text-white/52">{plan.description}</p>
        </div>
        {plan.popular ? (
          <span className="rounded-full bg-[#63f276] px-2 py-1 text-[10px] font-bold uppercase text-[#071009]">
            Popular
          </span>
        ) : null}
      </div>
      <p className="mt-5 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-5xl uppercase leading-none text-[#63f276]">
        {plan.priceFormatted}
      </p>
      <p className="mt-2 text-sm text-white/52">{plan.credits} credits for AI photo generation</p>
    </button>
  );
}

export default function AiPhotosPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<FunnelStep>("question");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PackageType>("popular");

  const currentQuestion = questions[questionIndex] || questions[0];
  const questionDone = step !== "question";
  const emailDone = step === "upload" || step === "plan";
  const uploadDone = step === "plan";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const previewImages = useMemo(
    () => files.slice(0, 4).map((file) => URL.createObjectURL(file)),
    [files]
  );

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

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      <PublicHeader />

      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,255,136,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(88,255,136,0.05)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="inline-flex border border-[#2d5b3f] bg-[#183022]/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.05em] text-[#62f175]">
                AI Dating Photos
              </p>
              <h1 className="mt-5 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[64px] uppercase leading-[0.9] tracking-[0.04em] sm:text-[92px]">
                Get better dating photos in one flow
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-8 text-white/58">
                Answer a quick questionnaire, leave your email, upload photos, choose a plan, and continue in the workspace.
              </p>

              <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="relative h-64 overflow-hidden border border-[#d94144]/70">
                  <Image src="/homepage/hero-before.png" alt="Before dating photo" fill className="object-cover" />
                  <span className="absolute bottom-2 right-2 border border-[#df4747] bg-[#301919] px-2 py-1 text-2xl font-bold text-[#ea4b4b]">
                    31
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#2e5a3f] bg-[#15221a] text-xl font-bold text-[#67f378]">
                  &gt;&gt;
                </div>
                <div className="relative h-64 overflow-hidden border border-[#57f06d]/70 shadow-[0_0_24px_rgba(94,243,111,0.28)]">
                  <Image src="/homepage/hero-after.png" alt="After dating photo" fill className="object-cover" />
                  <span className="absolute bottom-2 right-2 border border-[#57f06d] bg-[#183123] px-2 py-1 text-2xl font-bold text-[#63f276]">
                    87
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[#284d35] bg-[#10151b]/96 p-5 shadow-[0_0_42px_rgba(94,243,111,0.08)] sm:p-7">
              <div className="flex flex-wrap gap-x-5 gap-y-3 border-b border-white/10 pb-5">
                <StepPill label="Question" active={step === "question"} done={questionDone} />
                <StepPill label="Email" active={step === "email"} done={emailDone} />
                <StepPill label="Upload" active={step === "upload"} done={uploadDone} />
                <StepPill label="Plan" active={step === "plan"} done={false} />
              </div>

              {step === "question" ? (
                <div className="pt-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#63f276]">
                    Question {questionIndex + 1} of {questions.length}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight">{currentQuestion.title}</h2>
                  <div className="mt-6 grid gap-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => chooseAnswer(option)}
                        className="rounded-md border border-white/10 bg-black/20 px-4 py-4 text-left text-base text-white/78 transition hover:border-[#63f276]/65 hover:bg-[#132018]"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "email" ? (
                <div className="pt-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#63f276]">Email</p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight">Where should we keep your photo plan?</h2>
                  <p className="mt-3 text-white/58">Use the same email when you enter the workspace.</p>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="mt-6 w-full rounded-md border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition focus:border-[#63f276]/70"
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
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#63f276]">Upload</p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight">Upload your starting photos</h2>
                  <p className="mt-3 text-white/58">Use 4-10 clear selfies or existing profile photos for best output.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 flex min-h-[170px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#63f276]/45 bg-black/25 px-5 text-center transition hover:bg-[#102016]"
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
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#63f276]">Purchase Plan</p>
                  <h2 className="mt-3 text-3xl font-bold leading-tight">Choose the same plan used across the site</h2>
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
                  <Link
                    href={`/workspace/pricing?source=ai-photos&plan=${selectedPlan}`}
                    className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center rounded-sm bg-[#5ef36f] px-6 text-sm font-black uppercase tracking-[0.06em] text-[#0b0d10] transition hover:bg-[#78ff88]"
                  >
                    Continue to workspace
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
