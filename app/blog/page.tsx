import Image from "next/image";
import Link from "next/link";
import { blogPosts, type BlogPost } from "./mock-posts";

const topNavItems = [
  { label: "Dating Profile Review", href: "/dating-profile-review" },
  { label: "AI Dating Photos", href: "/ai-photos" },
  { label: "Blog", href: "/blog" },
];

const metrics = [
  { value: "724K+", label: "Profiles optimized" },
  { value: "4M+", label: "Dates improved" },
  { value: "2M+", label: "AI photos generated" },
  { value: "4.8/5", label: "Verified user rating" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Hero() {
  return (
    <section className="pt-16 sm:pt-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="inline-flex items-center gap-2 border border-[#2d5b3f] bg-[#183022]/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.05em] text-[#62f175]">
            <span>*</span>
            Dating Insights
          </div>

          <h1 className="mt-5 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[64px] uppercase leading-[0.9] tracking-[0.04em] text-white sm:text-[84px] xl:text-[98px]">
            <span className="text-[#5ff26f]">Master</span> The Art Of Dating
          </h1>

          <p className="mt-5 max-w-xl text-xl leading-8 text-white/55 sm:text-2xl">
            Stop guessing what works. Get data-driven advice, profile optimization tips, and expert strategies to level up your dating game.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ai-photos"
              className="inline-flex items-center justify-center gap-3 rounded-sm bg-[#5ef36f] px-8 py-3 text-base font-semibold text-[#0e1213] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#78ff88] hover:shadow-[0_0_18px_rgba(94,243,111,0.45)]"
            >
              Boost My Profile
              <span className="text-lg">-&gt;</span>
            </Link>
            <a
              href="#latest-posts"
              className="inline-flex items-center justify-center rounded-sm border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:border-[#57f06d]/60 hover:bg-white/10"
            >
              Read Latest Posts
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              <Image src="/homepage/gallery-dinner.png" alt="user" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
              <Image src="/homepage/gallery-suit.png" alt="user" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
              <Image src="/homepage/gallery-couch.png" alt="user" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-[#111] object-cover" />
            </div>
            <div>
              <p className="text-xl font-bold uppercase tracking-[0.06em] text-[#64f176]">5.0 rating</p>
              <p className="text-base text-white/55">84,000+ happy customers</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-7">
          <div className="relative">
            <div className="relative overflow-hidden border border-[#d94144]/70">
              <Image src="/homepage/hero-before.png" alt="before" width={320} height={390} className="h-[290px] w-full object-cover sm:h-[340px]" />
            </div>
            <div className="absolute -bottom-4 -right-3 flex h-16 w-16 items-center justify-center border-2 border-[#df4747] bg-[#301919] text-4xl font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[#ea4b4b]">
              31
            </div>
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-[#2e5a3f] bg-[#15221a] text-2xl font-bold text-[#67f378] shadow-[0_0_20px_rgba(94,243,111,0.25)]">
            &gt;&gt;
          </div>
          <div className="relative">
            <div className="relative overflow-hidden border border-[#57f06d]/70 shadow-[0_0_28px_rgba(94,243,111,0.36)]">
              <Image src="/homepage/hero-after.png" alt="after" width={320} height={390} className="h-[290px] w-full object-cover sm:h-[340px]" />
            </div>
            <div className="absolute -bottom-4 -right-3 flex h-16 w-16 items-center justify-center border-2 border-[#57f06d] bg-[#183123] text-4xl font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[#63f276]">
              87
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricStrip() {
  return (
    <section className="mt-14 bg-[#63f173] py-7 sm:py-9">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-6 px-4 text-center md:grid-cols-4 sm:px-6">
        {metrics.map((metric) => (
          <div key={metric.value}>
            <p className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-5xl uppercase leading-none tracking-[0.03em] text-[#0f1215] sm:text-6xl">
              {metric.value}
            </p>
            <p className="mt-2 text-sm font-medium text-[#1d3324] sm:text-base">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogSubNav() {
  return (
    <section className="border-b border-white/10 bg-[#0f1217]/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex -skew-x-12 bg-[#5ef36f] px-3 py-1">
          <span
            translate="no"
            className="notranslate skew-x-12 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl uppercase tracking-[0.05em] text-[#111]"
          >
            DatingPhotosAI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] text-white/65 lg:flex">
          {topNavItems.map((item) => (
            <Link key={item.label} href={item.href} className={`transition-colors ${item.label === "Blog" ? "text-white" : "hover:text-[#63f276]"}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-sm border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 sm:inline-flex">
            US EN
          </button>
          <Link href="/" className="hidden text-sm text-white/80 hover:text-white sm:inline-flex">
            Log In
          </Link>
          <Link
            href="/ai-photos"
            className="rounded-sm bg-[#5ef36f] px-4 py-2 text-sm font-semibold text-[#0f1215] transition-all hover:bg-[#7bff89]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group overflow-hidden rounded-md border border-[#2a633f]/70 bg-[#0d1117] shadow-[0_0_0_1px_rgba(87,240,109,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-[#57f06d]/80 hover:shadow-[0_10px_40px_rgba(87,240,109,0.16)]">
      <Link href={`/blog/${post.slug}`} className="block">
      <div className="relative overflow-hidden rounded-t-md">
        <Image
          src={post.coverImage}
          alt={post.title}
          width={552}
          height={423}
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.06em] text-white/45">
          <span>{post.category}</span>
          <span>{formatDate(post.publishDate)}</span>
        </div>

        <h3 className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[34px] uppercase leading-[1.03] tracking-[0.03em] text-white">
          {post.title}
        </h3>

        <p className="text-base leading-7 text-white/55">{post.excerpt}</p>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm text-white/55">
          <span>{post.author}</span>
          <span>{post.readTime}</span>
        </div>
      </div>
      </Link>
    </article>
  );
}

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0d10] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,255,136,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(88,255,136,0.06)_1px,transparent_1px)] bg-[size:58px_58px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_20%,rgba(22,30,24,0.55)_0%,rgba(11,13,16,0.95)_62%)]" />

      <div className="relative z-10">
        <Hero />
        <MetricStrip />
        <BlogSubNav />

        <section id="latest-posts" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-6">
          <h2 className="text-center font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[56px] uppercase leading-none tracking-[0.04em] text-white sm:text-[70px]">
            Latest Dating Insights
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
