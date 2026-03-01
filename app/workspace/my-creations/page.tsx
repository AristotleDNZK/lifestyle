import Image from "next/image";

interface CreationItem {
  id: string;
  type: "image" | "video";
  title: string;
  thumbnail: string;
  model: string;
  createdAt: string;
}

const creations: CreationItem[] = [
  {
    id: "cr-001",
    type: "image",
    title: "City Night Portrait",
    thumbnail: "/homepage/gallery-street.png",
    model: "Seedance 1.5",
    createdAt: "2026-02-28 21:34",
  },
  {
    id: "cr-002",
    type: "image",
    title: "Marina Suit Look",
    thumbnail: "/homepage/gallery-suit.png",
    model: "Seedance 1.5",
    createdAt: "2026-02-28 20:06",
  },
  {
    id: "cr-003",
    type: "video",
    title: "Forest Light Sequence",
    thumbnail: "/blog/cover-1.png",
    model: "Seedance 2.0",
    createdAt: "2026-02-27 18:22",
  },
  {
    id: "cr-004",
    type: "image",
    title: "Golden Hour Portrait",
    thumbnail: "/homepage/gallery-woman.png",
    model: "Seedance 1.5",
    createdAt: "2026-02-26 16:48",
  },
  {
    id: "cr-005",
    type: "video",
    title: "Cafe Walkthrough",
    thumbnail: "/blog/cover-3.png",
    model: "Seedance 2.0",
    createdAt: "2026-02-26 11:19",
  },
  {
    id: "cr-006",
    type: "image",
    title: "Classic Portrait Edit",
    thumbnail: "/homepage/hero-after.png",
    model: "Seedance 1.5",
    createdAt: "2026-02-25 23:02",
  },
];

function CreationCard({ item }: { item: CreationItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#0c1016] transition-all duration-300 hover:-translate-y-1 hover:border-[#57f06d]/60 hover:shadow-[0_14px_42px_rgba(87,240,109,0.2)]">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${
            item.type === "video"
              ? "bg-[#143f2b] text-[#79f89a]"
              : "bg-white/10 text-white/85"
          }`}
        >
          {item.type}
        </span>
        {item.type === "video" ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80">
            16:9
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold text-white">{item.title}</h3>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{item.model}</span>
          <span>{item.createdAt}</span>
        </div>
      </div>
    </article>
  );
}

export default function MyCreationsPage() {
  return (
    <>
      <header className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Workspace</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">My Creations</h1>
        <p className="mt-1 text-white/55">Browse your generated image and video history.</p>
      </header>

      <div className="mb-6 inline-flex rounded-lg border border-white/10 bg-[#0d1117] p-1">
        <button className="rounded-md px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
          Videos
        </button>
        <button className="rounded-md bg-white/10 px-4 py-2 text-sm text-white">
          Images
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {creations.map((item) => (
          <CreationCard key={item.id} item={item} />
        ))}
      </section>
    </>
  );
}

