import Image from "next/image";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

type CardItem = {
  title: string;
  desc: string;
};

type FAQItem = {
  q: string;
  a: string;
};

const navLinks = [
  { label: "Dating Profile Review", href: "/dating-profile-review" },
  { label: "AI Dating Photos", href: "/ai-photos" },
  { label: "Blog", href: "/blog" },
];

const stats = [
  { value: "2M+", label: "AI photos generated" },
  { value: "724K+", label: "Profiles optimized" },
  { value: "40", label: "Photos per pack" },
  { value: "4.8/5", label: "Verified rating" },
];

const steps: CardItem[] = [
  {
    title: "Upload a few photos",
    desc: "Start with 4-10 selfies or current profile photos. The flow keeps uploads private and ready for manual generation.",
  },
  {
    title: "Choose the dating style",
    desc: "Answer a short questionnaire so the system understands your goal, scene, and confidence level.",
  },
  {
    title: "Optimize in workspace",
    desc: "Continue to the workspace, review examples, tune advanced options, and generate your final AI dating photos.",
  },
];

const benefits: CardItem[] = [
  { title: "Natural dating output", desc: "Profile-ready photos with realistic light, skin detail, and app-friendly framing." },
  { title: "Manual control", desc: "Prompt, aspect ratio, model quality, and variations stay available when you need them." },
  { title: "Focused workflow", desc: "No placeholder tools. The workspace is centered on AI photo optimization and saved creations." },
];

const faqs: FAQItem[] = [
  {
    q: "How does the AI photo flow work?",
    a: "You answer a few questions, add email, upload photos, choose a plan, and continue to the workspace to generate manually.",
  },
  {
    q: "Can I use an empty prompt?",
    a: "Yes. The workspace uses the built-in dating photo optimization prompt when the prompt field is blank.",
  },
  {
    q: "Where do generated photos appear?",
    a: "They appear in the workspace preview and can be reviewed from My Creations.",
  },
  {
    q: "Is profile review still available?",
    a: "Yes. Dating Profile Review remains a separate scoring and report flow from AI Dating Photos.",
  },
];

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>;
}

function SectionHeader({
  kicker,
  title,
  desc,
}: {
  kicker?: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="max-w-3xl">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      {desc ? <p className="mt-4 text-lg leading-8 text-white/58">{desc}</p> : null}
    </div>
  );
}

function PrimaryButton({
  children,
  href = "/ai-photos",
}: {
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e5e5e5] px-6 py-3 text-sm font-semibold text-[#0b0d10] transition hover:bg-[#f1f1f1]"
    >
      {children}
      <span aria-hidden="true">-&gt;</span>
    </Link>
  );
}

function SecondaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#e5e5e5]/45 hover:bg-white/[0.06]"
    >
      {children}
    </Link>
  );
}

function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0c]/92 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5]/25 bg-[#151515] px-3 py-1.5">
            <span translate="no" className="notranslate font-semibold tracking-tight text-white">
              DatingPhotosAI
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/60 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-[#d4d4d8]">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/workspace/image-to-image">
                <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#e5e5e5]/45 hover:bg-white/[0.06]">
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/workspace/image-to-image">
                <button className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0f1215] transition hover:bg-[#f1f1f1]">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/workspace/image-to-image"
                className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0f1215] transition hover:bg-[#f1f1f1]"
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

function ScoreCard({
  src,
  score,
  label,
  good,
}: {
  src: string;
  score: string;
  label: string;
  good?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
      <Image src={src} alt={label} width={420} height={500} className="h-[360px] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
        <div className="flex items-end justify-between gap-4">
          <p className="text-sm font-medium text-white/72">{label}</p>
          <span
            className={`rounded-lg border px-3 py-1 text-base font-semibold ${
              good
                ? "border-[#a1a1aa] bg-[#202020] text-[#d4d4d8]"
                : "border-[#df4747] bg-[#301919] text-[#ea4b4b]"
            }`}
          >
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="pt-14 sm:pt-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="inline-flex rounded-full border border-[#e5e5e5]/25 bg-[#151515] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">
              AI dating photos
            </p>

            <h1 className="mt-5 max-w-3xl text-base font-semibold leading-[0.95] tracking-tight text-white sm:text-2xl">
              Upgrade your dating photos with AI
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/58 sm:text-xl">
              Upload photos, answer a short questionnaire, choose a plan, then optimize your final images from the DatingPhotosAI workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryButton href="/ai-photos">Get my AI photos</PrimaryButton>
              <SecondaryButton href="/dating-profile-review">
                Audit my dating photos
              </SecondaryButton>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <ScoreCard src="/homepage/hero-before.png" score="31" label="Before" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#151515] text-lg font-semibold text-[#e5e5e5]">
                &gt;&gt;
              </div>
              <ScoreCard src="/homepage/hero-after.png" score="87" label="After" good />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="mt-16 border-y border-white/10 bg-[#121212] py-8">
      <Container>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.value} className="rounded-xl border border-white/10 bg-[#101010] px-5 py-4">
              <p className="text-xl font-semibold tracking-tight text-[#d4d4d8]">{item.value}</p>
              <p className="mt-2 text-sm text-white/55">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          kicker="Workflow"
          title="A simple path from photos to workspace"
          desc="The public flow stays focused on collection and plan selection. Detailed generation controls stay inside the workspace."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-white/10 bg-[#121212] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#142419] text-sm font-semibold text-[#d4d4d8]">
                {index + 1}
              </div>
              <h3 className="mt-6 text-base font-semibold tracking-tight text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">{step.desc}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <SectionHeader
          kicker="Why it works"
          title="Built for dating-photo optimization"
          desc="The interface keeps the core experience tight: upload, optimize, review, and save."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-xl border border-white/10 bg-[#121212] p-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">{benefit.desc}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function GallerySection() {
  const images = [
    "/homepage/gallery-man.png",
    "/homepage/gallery-woman.png",
    "/homepage/gallery-dinner.png",
    "/homepage/gallery-suit.png",
  ];

  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <SectionHeader
          kicker="Examples"
          title="Profile-ready images, not decorative mockups"
          desc="Use example images to understand framing, lighting, and the type of output the workspace is optimized for."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((src) => (
            <article key={src} className="relative h-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
              <Image src={src} alt="AI generated dating photo example" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full border border-[#e5e5e5]/35 bg-black/55 px-3 py-1 text-xs font-semibold text-[#d4d4d8]">
                Example
              </span>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <SectionHeader title="Frequently asked questions" />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-white/10 bg-[#121212] p-6">
              <h3 className="font-semibold text-white">{item.q}</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">{item.a}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTASection() {
  return (
    <section className="pb-24 sm:pb-28">
      <Container>
        <div className="rounded-xl border border-[#e5e5e5]/25 bg-[#121212] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4d4d8]">Ready</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">Start your AI photo flow</h3>
              <p className="mt-3 max-w-2xl text-white/58">
                Keep the original chain intact: questionnaire, email, upload, purchase plan, then manual generation in the workspace.
              </p>
            </div>
            <PrimaryButton href="/ai-photos">Get my AI photos</PrimaryButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#101010] pb-8 pt-10">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p translate="no" className="notranslate text-sm text-white/45">
            c 2022-2026 DatingPhotosAI. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-5 text-sm text-white/45">
            <Link href="/terms-and-conditions">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refund</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b0c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:58px_58px]" />
      <div className="relative z-10">
        <SiteNavbar />
        <HeroSection />
        <StatsBar />
        <StepsSection />
        <BenefitsSection />
        <GallerySection />
        <FAQSection />
        <CTASection />
        <SiteFooter />
      </div>
    </main>
  );
}
