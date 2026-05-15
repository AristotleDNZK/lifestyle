"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TabType = "image" | "video" | "all";

interface Generation {
  id: string;
  type: "image" | "video";
  prompt: string;
  url: string;
  cost: number;
  status: "completed" | "failed";
  created_at: string;
}

interface UserStats {
  userId: string;
  credits: number;
  totalGenerations: number;
  totalSpent: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/user/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchGenerations = async (type?: TabType) => {
    try {
      const queryType = type === "all" ? "" : `?type=${type}`;
      const response = await fetch(`/api/user/generations${queryType}`);
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations);
      }
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchGenerations(activeTab)]);
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchGenerations(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchGenerations(activeTab)]);
    setRefreshing(false);
  };

  const filteredGenerations =
    activeTab === "all"
      ? generations
      : generations.filter((g) => g.type === activeTab);

  return (
    <main className="dpai-page dpai-radial-bg">
      <div className="border-b border-white/10 bg-[#101010]/92">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="dpai-label">Workspace</p>
              <h1 className="mt-2 text-xl font-semibold text-white">Dashboard</h1>
              <p className="mt-1 text-white/55">Manage your AI generations and credits</p>
            </div>

            {stats ? (
              <div className="rounded-xl border border-[#e5e5e5]/45 bg-[#121212] px-6 py-4 text-white">
                <div className="text-sm font-medium text-white/70">Available Credits</div>
                <div className="mt-1 text-xl font-semibold">{stats.credits.toLocaleString()}</div>
                <Link href="/pricing" className="mt-2 inline-block text-sm text-[#d4d4d8] hover:text-[#f1f1f1]">
                  Purchase more
                </Link>
              </div>
            ) : null}
          </div>

          {stats ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="dpai-panel-flat p-4">
                <div className="text-sm text-white/50">Total Generations</div>
                <div className="mt-1 text-base font-semibold text-white">{stats.totalGenerations}</div>
              </div>
              <div className="dpai-panel-flat p-4">
                <div className="text-sm text-white/50">Credits Spent</div>
                <div className="mt-1 text-base font-semibold text-white">{stats.totalSpent}</div>
              </div>
              <div className="dpai-panel-flat p-4">
                <div className="text-sm text-white/50">Avg. Cost</div>
                <div className="mt-1 text-base font-semibold text-white">
                  {stats.totalGenerations > 0
                    ? (stats.totalSpent / stats.totalGenerations).toFixed(1)
                    : "0"}{" "}
                  credits
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-4">
          <Link href="/generate" className="dpai-primary-btn">
            + New Generation
          </Link>
          <button onClick={handleRefresh} disabled={refreshing} className="dpai-secondary-btn">
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="dpai-panel mb-6">
          <div className="border-b border-white/10">
            <nav className="flex">
              {[
                ["all", "All Generations"],
                ["image", "Images"],
                ["video", "Videos"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value as TabType)}
                  className={`border-b-2 px-6 py-4 text-sm font-medium ${
                    activeTab === value
                      ? "border-[#e5e5e5] text-[#d4d4d8]"
                      : "border-transparent text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-white/45">Loading...</div>
            ) : filteredGenerations.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-xl font-semibold text-[#d4d4d8]">AI</div>
                <h3 className="mb-2 text-lg font-semibold text-white">No generations yet</h3>
                <p className="mb-4 text-white/55">Start creating amazing AI-generated content.</p>
                <Link href="/generate" className="dpai-primary-btn">
                  Create Your First Generation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredGenerations.map((generation) => (
                  <article
                    key={generation.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#101010] transition hover:border-[#a1a1aa]/55"
                  >
                    {generation.type === "image" ? (
                      <div className="relative h-48 bg-black/30">
                        <Image src={generation.url} alt={generation.prompt} fill className="object-cover" />
                      </div>
                    ) : null}

                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            generation.type === "image"
                              ? "bg-[#202020] text-[#d4d4d8]"
                              : "bg-white/10 text-white/75"
                          }`}
                        >
                          {generation.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-white/45">
                          {new Date(generation.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-2 text-sm text-white/65">{generation.prompt}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/45">
                          Cost: {generation.cost} credit{generation.cost !== 1 ? "s" : ""}
                        </span>
                        <a
                          href={generation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#d4d4d8] hover:text-[#f1f1f1]"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
