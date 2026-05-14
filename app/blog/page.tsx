import Image from "next/image";
import Link from "next/link";
import { blogPosts, type BlogPost } from "./mock-posts";

const topNavItems = [
  { label: "Dating Profile Review", href: "/dating-profile-review" },
  { label: "AI Dating Photos", href: "/ai-photos" },
  { label: "Blog", href: "/blog" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06090e]/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="inline-flex rounded-lg border border-[#5ef36f]/25 bg-[#10161a] px-3 py-1.5">
          <span translate="no" className="notranslate font-semibold tracking-tight text-white">
            DatingPhotosAI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/60 lg:flex">
          {topNavItems.map((item) => (
            <Link key={item.label} href={item.href} className={item.label === "Blog" ? "text-white" : "transition-colors hover:text-[#63f276]"}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/ai-photos"
          className="rounded-lg bg-[#5ef36f] px-4 py-2 text-sm font-semibold text-[#0f1215] transition hover:bg-[#7bff89]"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f1319] transition hover:border-[#5ef36f]/35">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative h-56 overflow-hidden bg-[#0d1117]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/42">
            <span>{post.category}</span>
            <span>{formatDate(post.publishDate)}</span>
          </div>

          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            {post.title}
          </h3>

          <p className="text-sm leading-6 text-white/58">{post.excerpt}</p>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm text-white/45">
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
    <main className="relative min-h-screen overflow-hidden bg-[#06090e] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,255,136,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(88,255,136,0.035)_1px,transparent_1px)] bg-[size:58px_58px]" />

      <div className="relative z-10">
        <BlogNav />

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#63f276]">
            Dating Insights
          </p>
          <h1 className="mt-4 max-w-3xl text-[52px] font-semibold leading-[0.98] tracking-tight text-white sm:text-[72px]">
            Practical guidance for better dating profiles
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/58">
            Data-driven advice, profile optimization notes, and examples that connect directly to the DatingPhotosAI flows.
          </p>
        </section>

        <section id="latest-posts" className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
