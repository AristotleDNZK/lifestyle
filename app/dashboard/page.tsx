"use client";

import { useState, useEffect } from "react";
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

  // Fetch user stats
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

  // Fetch generation history
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

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchGenerations(activeTab)]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Refresh when tab changes
  useEffect(() => {
    if (!loading) {
      fetchGenerations(activeTab);
    }
  }, [activeTab]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchGenerations(activeTab)]);
    setRefreshing(false);
  };

  // Filter generations by tab
  const filteredGenerations =
    activeTab === "all"
      ? generations
      : generations.filter((g) => g.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Stats */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage your AI generations and credits
              </p>
            </div>

            {/* Credit Balance */}
            {stats && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg">
                <div className="text-sm font-medium opacity-90">
                  Available Credits
                </div>
                <div className="text-3xl font-bold mt-1">
                  {stats.credits.toLocaleString()}
                </div>
                <Link
                  href="/pricing"
                  className="text-sm underline opacity-90 hover:opacity-100 mt-2 inline-block"
                >
                  Purchase more →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Generations</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalGenerations}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Credits Spent</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalSpent}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Avg. Cost</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalGenerations > 0
                    ? (stats.totalSpent / stats.totalGenerations).toFixed(1)
                    : "0"}{" "}
                  credits
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Link
            href="/generate"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            + New Generation
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Generations
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "image"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "video"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Videos
              </button>
            </nav>
          </div>

          {/* Generation Grid */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading...
              </div>
            ) : filteredGenerations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No generations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start creating amazing AI-generated content!
                </p>
                <Link
                  href="/generate"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Create Your First Generation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGenerations.map((generation) => (
                  <div
                    key={generation.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image Preview */}
                    {generation.type === "image" && (
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={generation.url}
                          alt={generation.prompt}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {/* Type Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            generation.type === "image"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {generation.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(generation.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Prompt */}
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {generation.prompt}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Cost: {generation.cost} credit
                          {generation.cost !== 1 ? "s" : ""}
                        </span>
                        <a
                          href={generation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
