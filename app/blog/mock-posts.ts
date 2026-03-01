export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  author: string;
  publishDate: string;
  category: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "post-1",
    slug: "tinder-algorithm-2026-decoded",
    title: "Tinder Algorithm 2026 Decoded: 7 Hacks To Double Matches",
    coverImage: "/blog/cover-1.png",
    excerpt:
      "Discover the core ranking signals that shape visibility and learn practical profile tweaks that compound over time.",
    author: "ROAST Team",
    publishDate: "2026-02-08",
    category: "Tinder Tips",
    readTime: "8 min read",
  },
  {
    id: "post-2",
    slug: "understanding-tinder-elo-score",
    title: "Understanding Tinder ELO: Boost Your Matches With Effective Signals",
    coverImage: "/blog/cover-2.png",
    excerpt:
      "A practical guide to Tinder ELO behavior, profile quality indicators, and messaging habits that improve ranking.",
    author: "Ethan Walker",
    publishDate: "2026-02-04",
    category: "Profile Strategy",
    readTime: "6 min read",
  },
  {
    id: "post-3",
    slug: "dry-texting-fixes",
    title: "Dry Texting: 15 Ways To Avoid Becoming A Dry Texter",
    coverImage: "/blog/cover-3.png",
    excerpt:
      "Keep your conversations engaging with better openers, stronger follow-ups, and a rhythm that feels natural.",
    author: "Maya Scott",
    publishDate: "2026-01-30",
    category: "Messaging",
    readTime: "7 min read",
  },
  {
    id: "post-4",
    slug: "how-to-send-pictures-on-tinder",
    title: "How To Send Pictures On Tinder In 2026: Explained In Detail",
    coverImage: "/blog/cover-4.png",
    excerpt:
      "What Tinder supports, what it blocks, and safe alternatives that still build attraction without hurting trust.",
    author: "ROAST Team",
    publishDate: "2026-01-25",
    category: "App Features",
    readTime: "5 min read",
  },
  {
    id: "post-5",
    slug: "tinder-coins-guide",
    title: "Tinder Coins: All You Need To Know",
    coverImage: "/blog/cover-5.png",
    excerpt:
      "Pricing, value breakdown, and which paid actions make sense when you want better visibility quickly.",
    author: "Liam Perez",
    publishDate: "2026-01-20",
    category: "Product Guide",
    readTime: "5 min read",
  },
  {
    id: "post-6",
    slug: "tinder-vibes-guide",
    title: "Tinder Vibes In 2026: Full Walkthrough And Breakdown",
    coverImage: "/blog/cover-6.png",
    excerpt:
      "A tactical walkthrough for using Vibes prompts to qualify faster and move from match to date with intent.",
    author: "Ava Kim",
    publishDate: "2026-01-16",
    category: "Dating Psychology",
    readTime: "9 min read",
  },
];
