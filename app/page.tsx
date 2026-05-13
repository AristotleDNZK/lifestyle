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
  { value: "2M+", label: "Professional dating photos" },
  { value: "724K+", label: "Profiles optimized" },
  { value: "40", label: "Photos per pack" },
  { value: "4.8/5", label: "500+ verified reviews" },
];

const steps: CardItem[] = [
  {
    title: "UPLOAD YOUR PHOTOS",
    desc: "Upload a few selfies. The model learns your face, angles, and style, then builds profile-ready results.",
  },
  {
    title: "AI CREATES YOUR BEST VERSIONS",
    desc: "Get 40 high quality photos across multiple looks and settings. Clean results without fake filter artifacts.",
  },
  {
    title: "DOWNLOAD AND DOMINATE",
    desc: "Pick favorites and post instantly on Tinder, Bumble, Hinge, and more for stronger first impressions.",
  },
];

const benefits: CardItem[] = [
  { title: "INSTANT ARSENAL", desc: "Full photo pack in around 30 minutes. No scheduling and no studio workflow." },
  { title: "COST-EFFECTIVE DOMINATION", desc: "Professional look at a fraction of photographer cost." },
  { title: "CONVENIENT BATTLEFIELD", desc: "Generate from your phone any time with zero travel overhead." },
  { title: "VERSATILE ARSENAL", desc: "Mix scenes, outfits, and tone to cover multiple dating contexts." },
  { title: "GUARANTEED RESULTS", desc: "Support and satisfaction process focused on better profile performance." },
];

const faqs: FAQItem[] = [
  {
    q: "Are AI photos allowed on Tinder, Bumble, and Hinge?",
    a: "Yes. They are commonly used as long as photos still represent you naturally.",
  },
  {
    q: "How realistic do the AI dating photos look?",
    a: "Results are generated with realistic lighting, skin detail, and natural poses.",
  },
  {
    q: "How long does it take to get my AI photos?",
    a: "Most packs are delivered in around 30 minutes after upload.",
  },
  {
    q: "How many selfies do I need to upload?",
    a: "4 to 10 selfies with varied angles and expressions usually gives best output.",
  },
  {
    q: "Can I get a refund if I am not satisfied?",
    a: "Yes, support can guide revision and satisfaction resolution options.",
  },
  {
    q: "Do the photos work on all dating apps?",
    a: "Yes. Photos are optimized for Tinder, Bumble, Hinge, Match, and similar apps.",
  },
  {
    q: "Do I need to hire a photographer first?",
    a: "No, phone selfies are enough for generation.",
  },
  {
    q: "Will these photos improve my profile?",
    a: "Better photos generally improve first impressions and response quality.",
  },
  {
    q: "What resolution are the final pictures?",
    a: "Final photos are high resolution for both mobile and desktop use.",
  },
  {
    q: "Who owns the generated photos?",
    a: "You own your generated outputs and control where they are used.",
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
    <div className="mx-auto max-w-3xl text-center">
      {kicker ? <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[#55ec6e]">{kicker}</p> : null}
      <h2 className="mt-2 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[40px] uppercase leading-[0.92] tracking-[0.04em] text-white sm:text-[56px]">
        {title}
      </h2>
      {desc ? <p className="mt-4 text-lg leading-8 text-white/55">{desc}</p> : null}
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-[#57f06d]/70" />
      <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#57f06d]/70" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#57f06d]/70" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#57f06d]/70" />
    </>
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
      className="inline-flex items-center justify-center gap-3 rounded-sm bg-[#5ef36f] px-7 py-3 text-base font-semibold text-[#0e1213] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#78ff88] hover:shadow-[0_0_18px_rgba(94,243,111,0.45)]"
    >
      {children}
      <span className="text-lg">-&gt;</span>
    </Link>
  );
}

function SecondaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex items-center justify-center rounded-sm border border-white/10 bg-white/5 px-7 py-3 text-base font-semibold text-white transition-all duration-200 hover:border-[#57f06d]/60 hover:bg-white/10";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}
function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#20432f]/70 bg-[#0e1014]/85 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="#hero" className="inline-flex -skew-x-12 bg-[#5ef36f] px-3 py-1">
            <span
              translate="no"
              className="notranslate skew-x-12 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl uppercase tracking-[0.05em] text-[#111]"
            >
              DatingPhotosAI
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[15px] text-white/65 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-[#63f276]">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/workspace">
                <button className="rounded-sm border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#57f06d]/50">
                  {"\u767b\u5f55"}
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/workspace">
                <button className="rounded-sm bg-[#5ef36f] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#7bff89] hover:shadow-[0_0_14px_rgba(94,243,111,0.45)]">
                  {"\u6ce8\u518c"}
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/workspace"
                className="rounded-sm bg-[#5ef36f] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#7bff89] hover:shadow-[0_0_14px_rgba(94,243,111,0.45)]"
              >
                {"\u8fdb\u5165\u5de5\u4f5c\u53f0"}
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
  good,
}: {
  src: string;
  score: string;
  good?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={`relative overflow-hidden border ${
          good
            ? "border-[#57f06d]/70 shadow-[0_0_28px_rgba(94,243,111,0.36)]"
            : "border-[#d94144]/70"
        }`}
      >
        <Image src={src} alt="result card" width={320} height={390} className="h-[290px] w-full object-cover sm:h-[340px]" />
      </div>
      <div
        className={`absolute -bottom-4 -right-3 flex h-16 w-16 items-center justify-center border-2 text-4xl font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] ${
          good
            ? "border-[#57f06d] bg-[#183123] text-[#63f276]"
            : "border-[#df4747] bg-[#301919] text-[#ea4b4b]"
        }`}
      >
        {score}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section id="hero" className="pt-14 sm:pt-20">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 border border-[#2d5b3f] bg-[#183022]/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.05em] text-[#62f175]">
              <span>*</span>
              2M+ high-performing dating pics generated
            </div>

            <h1 className="mt-5 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[64px] uppercase leading-[0.9] tracking-[0.04em] text-white sm:text-[86px] xl:text-[102px]">
              <span className="text-[#5ff26f]">10X</span> Your Dates With
              <br />
              AI Dating Photos
            </h1>

            <p className="mt-5 max-w-xl text-xl leading-8 text-white/55 sm:text-2xl">
              Upload 4-10 selfies. Get 40 professional dating photos in 30 minutes. Built to increase your match rate across Tinder, Bumble, and Hinge.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryButton href="/ai-photos">GET MY AI PHOTOS</PrimaryButton>
              <SecondaryButton href="/dating-profile-review">
                Audit my Dating Photos
              </SecondaryButton>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                <Image src="/homepage/gallery-dinner.png" alt="customer" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
                <Image src="/homepage/gallery-suit.png" alt="customer" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
                <Image src="/homepage/gallery-couch.png" alt="customer" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
              </div>
              <div>
                <p className="text-xl font-bold uppercase tracking-[0.06em] text-[#64f176]">5.0 rating</p>
                <p className="text-base text-white/55">84,000+ happy customers</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-7">
            <ScoreCard src="/homepage/hero-before.png" score="31" />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-[#2e5a3f] bg-[#15221a] text-2xl font-bold text-[#67f378] shadow-[0_0_20px_rgba(94,243,111,0.25)]">
              &gt;&gt;
            </div>
            <ScoreCard src="/homepage/hero-after.png" score="87" good />
          </div>
        </div>
      </Container>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="mt-16 bg-[#63f173] py-7 sm:py-10">
      <Container>
        <div className="grid grid-cols-2 gap-y-7 text-center md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.value}>
              <p className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-5xl uppercase leading-none tracking-[0.03em] text-[#0f1215] sm:text-6xl">
                {item.value}
              </p>
              <p className="mt-2 text-base font-medium text-[#1d3324] sm:text-xl">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function StepsSection() {
  return (
    <section id="steps" className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          kicker="Diversify your arsenal"
          title="Get Your AI Dating Photos In 3 Steps"
          desc="Get an awesome dating profile without the effort. Our AI handles the heavy lifting so you can focus on better conversations and better dates."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="group relative border border-[#264d35] bg-[#161a1f]/90 px-7 py-9 transition-all duration-200 hover:-translate-y-1 hover:border-[#57f06d]/70 hover:shadow-[0_0_24px_rgba(87,240,109,0.2)]">
              <CornerMarks />
              <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#4ce66f]/65 bg-[#10161a] font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-3xl tracking-[0.04em] text-[#67f377]">
                AI
              </div>
              <h3 className="mt-7 text-center font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-4xl uppercase leading-none tracking-[0.04em] text-[#63f174] sm:text-[42px]">
                {step.title}
              </h3>
              <p className="mt-5 text-center text-lg leading-8 text-white/55">{step.desc}</p>
              <div className="mx-auto mt-8 h-px w-20 bg-[#4de56e]/60" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
function CompareColumn({
  title,
  src,
  score,
  good,
  points,
}: {
  title: string;
  src: string;
  score: string;
  good?: boolean;
  points: string[];
}) {
  return (
    <div>
      <p className={`mb-4 text-center font-semibold uppercase tracking-[0.05em] ${good ? "text-[#63f276]" : "text-white/50"}`}>{title}</p>
      <div className={`relative mx-auto max-w-[330px] overflow-hidden border ${good ? "border-[#58ef70]/80 shadow-[0_0_26px_rgba(94,243,111,0.33)]" : "border-[#e0484b]/75"}`}>
        <Image src={src} alt={title.toLowerCase()} width={380} height={560} className="h-[320px] w-full object-cover" />
        <div className={`absolute bottom-3 left-3 flex h-14 w-14 items-center justify-center border-2 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-4xl ${good ? "border-[#57f06d] bg-[#183123] text-[#63f276]" : "border-[#df4747] bg-[#301919] text-[#ea4b4b]"}`}>
          {score}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[330px] space-y-3">
        {points.map((point) => (
          <div key={point} className="flex items-center gap-3 border border-white/8 bg-[#0f1215]/90 px-4 py-2 text-sm font-semibold uppercase tracking-[0.03em] text-white/80">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${good ? "bg-[#1f4e2e] text-[#63f276]" : "bg-[#3a1d1d] text-[#e44f4f]"}`}>
              {good ? "Y" : "N"}
            </span>
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

function FirstImpressionSection() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <SectionHeader
          title={
            <>
              First Impressions <span className="font-['Brush_Script_MT','Segoe_Script',cursive] lowercase text-[#58f06d]">matter</span>
            </>
          }
          desc="First impressions are everything. Our pipeline upgrades your profile photos from average to standout while keeping your identity natural."
        />

        <div className="relative mt-12 border border-[#264d35] bg-[#161a1f]/90 px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <CompareColumn
              title="BEFORE"
              src="/homepage/compare-before.png"
              score="31"
              points={["AMATEUR QUALITY", "AWKWARD POSE", "BAD LIGHTING", "WEAK BACKGROUND"]}
            />

            <div className="mx-auto flex h-12 w-20 items-center justify-center rounded-sm border border-[#295538] bg-[#15221b] text-2xl font-bold text-[#61ef75] shadow-[0_0_18px_rgba(94,243,111,0.25)]">
              &gt;&gt;
            </div>

            <CompareColumn
              title="AFTER"
              src="/homepage/compare-after.png"
              score="87"
              good
              points={["PROFESSIONAL PHOTOS", "CONFIDENT POSE", "PERFECT LIGHTING", "100% UNDETECTABLE"]}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <SectionHeader title="Why Our AI Photos Win" />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="relative border border-[#264d35] bg-[#161a1f]/90 px-7 py-8">
              <CornerMarks />
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#4ce66f]/65 bg-[#10161a] font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl text-[#63f276]">
                AI
              </div>
              <h3 className="mt-6 text-center font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[42px] uppercase leading-none tracking-[0.04em] text-[#60f172]">
                {benefit.title}
              </h3>
              <p className="mt-4 text-center text-lg leading-8 text-white/55">{benefit.desc}</p>
              <div className="mx-auto mt-8 h-px w-20 bg-[#4de56e]/60" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function GalleryCard({
  src,
  quote,
}: {
  src?: string;
  quote: string;
}) {
  return (
    <article className="group relative h-[250px] overflow-hidden border border-[#264d35] bg-[#11151a] sm:h-[330px]">
      {src ? (
        <Image
          src={src}
          alt="AI generated profile"
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(51,62,74,0.5),rgba(9,11,13,0.96)_70%)]" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      <span className="absolute left-3 top-3 bg-[#1f2822] px-2 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-[#62f276]">AI Generated</span>
      <p className="absolute bottom-3 left-3 text-xl italic text-white/85">{quote}</p>
    </article>
  );
}

function GallerySection() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <SectionHeader
          kicker="100% AI Generated"
          title="Not Made In A Studio. 100% AI Generated."
          desc="Real users transformed their dating profiles with AI-generated images designed for stronger first impressions."
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-base text-white/55">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-[#63f276]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GalleryCard quote='"Amazing results!"' />
          <GalleryCard src="/homepage/gallery-man.png" quote='"Quick and easy."' />
          <GalleryCard src="/homepage/gallery-woman.png" quote='"Perfect quality."' />
          <GalleryCard quote='"Exceeded expectations."' />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GalleryCard src="/homepage/gallery-dinner.png" quote='"Highly recommend!"' />
          <GalleryCard src="/homepage/gallery-suit.png" quote='"So realistic and clean."' />
          <GalleryCard src="/homepage/gallery-couch.png" quote='"The best AI photos."' />
          <GalleryCard src="/homepage/gallery-street.png" quote='"Great value for money."' />
        </div>
      </Container>
    </section>
  );
}
function StatusBadge({ good }: { good: boolean }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${good ? "bg-[#225c35] text-[#63f276]" : "bg-[#3d1b1d] text-[#ea5252]"}`}>
      {good ? "Y" : "N"}
    </span>
  );
}

function TestimonialsSection() {
  const items = [
    { text: "Its a great platform", author: "Randy" },
    { text: "Interesting pictures well done", author: "Eduards" },
    { text: "Absolute game changer", author: "Julian Taylor" },
    { text: "The app did exactly what I needed", author: "Richard Lebherz" },
  ];

  return (
    <section id="testimonials" className="pb-24 sm:pb-32">
      <Container>
        <SectionHeader kicker="Real results from real people" title="See The Transformation" desc="Better photos lead to better matches. Here is what users reported after upgrading their profile pictures." />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.author} className="border border-white/10 bg-[#181c21]/80 p-6">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-[#f8cf49]">*****</p>
              <p className="mt-4 text-lg text-white/75">{item.text}</p>
              <p className="mt-6 text-xl font-semibold text-white">{item.author}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PricingSection() {
  const rows = [
    ["40 PHOTOS", true, false],
    ["MULTIPLE STYLES", true, false],
    ["30 MINUTE DELIVERY", true, false],
    ["UNLIMITED RETAKES", true, false],
    ["PROFILE OPTIMIZATION INCLUDED", true, false],
    ["10-20 PHOTOS", false, true],
    ["ONE LOCATION", false, true],
    ["ONE STYLE", false, true],
    ["LIMITED RETAKES", false, true],
    ["NO PROFILE HELP", false, true],
  ] as const;

  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <SectionHeader title="10X Cheaper Than A Photoshoot" desc="Professional dating photos at an affordable price. Our AI tool delivers premium results without the traditional studio cost." />

        <div className="mt-12 overflow-x-auto border border-[#264d35]">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-[#13171d] text-left">
                <th className="px-4 py-5 text-sm uppercase tracking-[0.06em] text-white/55">Feature</th>
                <th className="border-x border-[#3f8d52]/55 bg-[#1c3d29]/80 px-4 py-4 text-center">
                  <p
                    translate="no"
                    className="notranslate font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[34px] uppercase leading-none text-[#61f275]"
                  >
                    DatingPhotosAI
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-[#69f17a]">$39/mo</p>
                </th>
                <th className="px-4 py-4 text-center">
                  <p className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[34px] uppercase leading-none text-white">Pro Photographer</p>
                  <p className="mt-1 text-3xl font-semibold text-white">$200-500</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feature, ai, pro], i) => (
                <tr key={feature} className={i % 2 === 0 ? "bg-[#0f1216]" : "bg-[#151a20]"}>
                  <td className="px-4 py-4 text-sm font-medium uppercase tracking-[0.03em] text-white/70">{feature}</td>
                  <td className="border-x border-[#3f8d52]/55 bg-[#183523]/70 px-4 py-4 text-center"><StatusBadge good={ai} /></td>
                  <td className="px-4 py-4 text-center"><StatusBadge good={pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}

function GuaranteeAndFAQ() {
  return (
    <>
      <section className="pb-24 sm:pb-32">
        <Container>
          <div className="relative border border-[#3f8d52] bg-[#151a1f]/92 px-6 py-12 text-center shadow-[0_0_28px_rgba(87,240,109,0.25)] sm:px-14">
            <CornerMarks />
            <h3 className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[48px] uppercase leading-none tracking-[0.04em] text-[#63f276] sm:text-[64px]">100% Satisfaction Guarantee - Match Increase Guarantee</h3>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/58 sm:text-2xl">If you do not see a meaningful increase in photo quality and confidence, contact support for a fast resolution.</p>
            <div className="mt-8"><PrimaryButton href="/ai-photos">GET MY AI PHOTOS</PrimaryButton></div>
          </div>
        </Container>
      </section>

      <section id="faq" className="pb-24 sm:pb-32">
        <Container>
          <SectionHeader title="Frequently Asked Questions" />
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.q} className="relative border border-[#264d35] bg-[#161a1f]/92 p-6">
                <CornerMarks />
                <h3 className="font-semibold text-white sm:text-xl">{item.q}</h3>
                <p className="mt-3 text-base leading-7 text-white/60 sm:text-lg">{item.a}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24 sm:pb-28">
        <Container>
          <div className="relative border border-[#3f8d52] bg-[#151a1f]/92 px-6 py-11 text-center shadow-[0_0_28px_rgba(87,240,109,0.2)] sm:px-14">
            <CornerMarks />
            <h3 className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[52px] uppercase leading-none tracking-[0.04em] text-[#63f276] sm:text-[68px]">Ready To Upgrade Your Arsenal?</h3>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/58 sm:text-2xl">Get 40 professional dating photos without the studio overhead. Upgrade your profile and move faster on every app.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/ai-photos">GET MY AI PHOTOS</PrimaryButton>
              <SecondaryButton href="/dating-profile-review">
                Audit my Dating Photos
              </SecondaryButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[#223627] bg-[#101317] pb-8 pt-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="inline-flex -skew-x-12 bg-[#5ef36f] px-3 py-1">
              <span
                translate="no"
                className="notranslate skew-x-12 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl uppercase tracking-[0.05em] text-[#111]"
              >
                DatingPhotosAI
              </span>
            </div>
            <p className="mt-4 text-base text-white/55">AI-powered dating optimization</p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Products</h4>
            <ul className="mt-4 space-y-2 text-base text-white/55"><li>Dating Profile Review</li><li>AI Dating Photos</li></ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Resources</h4>
            <ul className="mt-4 space-y-2 text-base text-white/55"><li>Blog</li><li>Support</li></ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Latest Articles</h4>
            <ul className="mt-4 space-y-2 text-base text-white/55"><li>160+ Good Morning Texts for Him</li><li>21 Online Dating Red Flags</li><li>Why Bumble does not work for guys</li><li>50+ Fun Questions to Ask A Guy</li><li>How To Turn A Girl: Full Guide</li></ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/45">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p translate="no" className="notranslate">c 2022-2026 DatingPhotosAI. All rights reserved.</p>
            <div className="flex flex-wrap gap-5 text-white/45"><span>Terms</span><span>Privacy</span><span>Refund</span><span>Disclaimer</span><span>Cookies</span></div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0d10] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,255,136,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(88,255,136,0.06)_1px,transparent_1px)] bg-[size:58px_58px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(22,30,24,0.55)_0%,rgba(11,13,16,0.95)_62%)]" />

      <div className="relative z-10">
        <SiteNavbar />
        <HeroSection />
        <StatsBar />
        <StepsSection />
        <FirstImpressionSection />
        <BenefitsSection />
        <GallerySection />
        <TestimonialsSection />
        <PricingSection />
        <GuaranteeAndFAQ />
        <SiteFooter />
      </div>
    </main>
  );
}
