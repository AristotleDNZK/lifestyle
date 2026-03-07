"use client";

import { useEffect, useMemo, useState } from "react";

type GenerationType = "image" | "video";
type ActiveTab = "images" | "videos";

type GenerationRecord = {
  id: string;
  type: GenerationType;
  prompt: string | null;
  url: string | null;
  created_at: string;
  model?: string | null;
  model_id?: string | null;
  model_name?: string | null;
  aspect_ratio?: string | null;
};

type GenerationsResponse = {
  data?: GenerationRecord[];
  generations?: GenerationRecord[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
};

function formatDateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function promptPreview(prompt: string | null) {
  const text = (prompt || "").trim();
  if (!text) return "No prompt";
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function cardTitle(prompt: string | null, type: GenerationType) {
  const text = (prompt || "").trim();
  if (!text) return type === "video" ? "Untitled Video" : "Untitled Image";
  return text.length > 34 ? `${text.slice(0, 34)}...` : text;
}

function modelLabel(item: GenerationRecord) {
  return (
    item.model_name ||
    item.model_id ||
    item.model ||
    (item.type === "video" ? "Seedance 2.0" : "Seedance 1.5")
  );
}

function CreationCard({ item }: { item: GenerationRecord }) {
  const ratio = item.aspect_ratio || (item.type === "video" ? "16:9" : null);

  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#0c1016] transition-all duration-300 hover:-translate-y-1 hover:border-[#57f06d]/60 hover:shadow-[0_14px_42px_rgba(87,240,109,0.2)]">
      <div className="relative h-52 overflow-hidden bg-black/30">
        {item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={cardTitle(item.prompt, item.type)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/45">
            No preview
          </div>
        )}
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
        {ratio ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80">
            {ratio}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-white">
          {cardTitle(item.prompt, item.type)}
        </h3>
        <p className="line-clamp-2 text-xs text-white/60">{promptPreview(item.prompt)}</p>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="line-clamp-1">{modelLabel(item)}</span>
          <span>{formatDateLabel(item.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1016]"
        >
          <div className="h-52 animate-pulse bg-white/[0.06]" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function MyCreationsPage() {
  const [tab, setTab] = useState<ActiveTab>("images");
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/generations?limit=100", {
          cache: "no-store",
        });
        const data = (await res.json()) as GenerationsResponse;

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load generation history.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.generations)
            ? data.generations
            : [];

        if (!cancelled) {
          setRecords(list);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load generation history.");
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const target: GenerationType = tab === "images" ? "image" : "video";
    return records.filter((item) => item.type === target);
  }, [records, tab]);

  return (
    <>
      <header className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Workspace</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">My Creations</h1>
        <p className="mt-1 text-white/55">Browse your generated image and video history.</p>
      </header>

      <div className="mb-6 inline-flex rounded-lg border border-white/10 bg-[#0d1117] p-1">
        <button
          type="button"
          onClick={() => setTab("videos")}
          className={`rounded-md px-4 py-2 text-sm transition ${
            tab === "videos"
              ? "bg-white/10 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          Videos
        </button>
        <button
          type="button"
          onClick={() => setTab("images")}
          className={`rounded-md px-4 py-2 text-sm transition ${
            tab === "images"
              ? "bg-white/10 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          Images
        </button>
      </div>

      {loading ? <LoadingGrid /> : null}

      {!loading && error ? (
        <div className="rounded-xl border border-[#ff4b4b]/40 bg-[#2a1010] p-4 text-sm text-[#ffb3b3]">
          {error}
        </div>
      ) : null}

      {!loading && !error && !filtered.length ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1117] p-10 text-center">
          <p className="text-base font-semibold text-white/80">No creations yet</p>
          <p className="mt-2 text-sm text-white/50">
            You have not generated any {tab === "images" ? "images" : "videos"} yet.
            Create one now.
          </p>
        </div>
      ) : null}

      {!loading && !error && filtered.length ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <CreationCard key={item.id} item={item} />
          ))}
        </section>
      ) : null}
    </>
  );
}
