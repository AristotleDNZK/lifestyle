import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../mock-posts";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find((item) => item.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white">
      <header className="border-b border-[#20432f]/70 bg-[#0e1014]">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex -skew-x-12 bg-[#5ef36f] px-3 py-1">
            <span className="skew-x-12 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-2xl uppercase tracking-[0.05em] text-[#111]">
              DatingPhotosAI
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/65">
            <Link href="/dating-profile-review" className="hover:text-[#63f276]">
              Dating Profile Review
            </Link>
            <Link href="/ai-photos" className="hover:text-[#63f276]">
              AI Dating Photos
            </Link>
            <Link href="/blog" className="text-white">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/blog" className="text-sm font-semibold text-[#63f276] hover:text-[#8dff9c]">
          Back to Blog
        </Link>

        <div className="mt-8">
          <p className="text-sm uppercase tracking-[0.12em] text-[#63f276]">
            {post.category} / {formatDate(post.publishDate)}
          </p>
          <h1 className="mt-4 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[56px] uppercase leading-[0.95] tracking-[0.03em] sm:text-[84px]">
            {post.title}
          </h1>
          <p className="mt-5 text-xl leading-8 text-white/58">{post.excerpt}</p>
        </div>

        <div className="relative mt-10 h-[420px] overflow-hidden rounded-md border border-[#2a633f]/70 bg-[#0d1117]">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>

        <div className="prose prose-invert mt-10 max-w-none prose-p:text-white/68 prose-li:text-white/68 prose-headings:text-white">
          <p>
            A stronger dating profile starts with clearer signals. Your first image needs to show face,
            style, and trust quickly enough that a match can understand your best angle before they scroll.
          </p>
          <p>
            The practical fix is not adding more photos. It is replacing weak photos with a tighter set:
            one confident lead image, one lifestyle image, one social proof image, and one image that makes
            the conversation easier to start.
          </p>
          <h2>What to improve first</h2>
          <ul>
            <li>Use clean lighting and crop out distractions around the face.</li>
            <li>Keep outfits intentional and consistent with the type of dates you want.</li>
            <li>Remove low-effort selfies, group ambiguity, and photos where you are hard to identify.</li>
            <li>Generate or retake missing scenes before changing bio copy.</li>
          </ul>
          <p>
            DatingPhotosAI turns that review into an action path: answer the questionnaire, upload photos,
            choose a plan, and continue from the workspace with enough context to generate better options.
          </p>
        </div>

        <div className="mt-12 rounded-md border border-[#3f8d52] bg-[#151a1f] p-6 text-center">
          <h2 className="font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-5xl uppercase text-[#63f276]">
            Ready for better dating photos?
          </h2>
          <Link
            href="/ai-photos"
            className="mt-5 inline-flex rounded-sm bg-[#5ef36f] px-7 py-3 text-base font-semibold text-[#0e1213] transition hover:bg-[#78ff88]"
          >
            Get My AI Photos
          </Link>
        </div>
      </article>
    </main>
  );
}
