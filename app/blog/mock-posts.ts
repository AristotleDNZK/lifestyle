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
    author: "DatingPhotosAI Team",
    publishDate: "2026-02-08",
    category: "Tinder Tips",
    readTime: "8 min read",
  },
];
