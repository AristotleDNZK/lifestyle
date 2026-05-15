"use client";

import { useState } from "react";
import Image from "next/image";
import { pollGenerationJob } from "@/lib/generation-jobs";

type GenerationType = "image" | "video";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState<GenerationType>("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (activeTab === "video") {
        setResult({
          status: "coming_soon",
          message: "Video generation is coming soon.",
        });
        return;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          prompt: prompt.trim(),
          aspectRatio: activeTab === "image" ? aspectRatio : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (!data?.jobId) {
        throw new Error(data?.error || "Generation job was queued without a jobId.");
      }

      const job = await pollGenerationJob(String(data.jobId));
      if (!job.imageUrl) {
        throw new Error("Generation completed but no image URL was returned.");
      }

      setResult({
        success: true,
        type: "image",
        url: job.imageUrl,
        prompt: job.prompt || prompt.trim(),
        creditsUsed: job.cost,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dpai-page dpai-radial-bg">
      <header className="border-b border-white/10 bg-[#101010]/92">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="dpai-label">Studio</p>
          <h1 className="mt-2 text-xl font-semibold text-white">AI Generation Studio</h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="dpai-panel mb-6">
          <div className="border-b border-white/10">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("image")}
                className={`border-b-2 px-6 py-4 text-sm font-medium ${
                  activeTab === "image"
                    ? "border-[#e5e5e5] text-[#d4d4d8]"
                    : "border-transparent text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                Image Generation
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`border-b-2 px-6 py-4 text-sm font-medium ${
                  activeTab === "video"
                    ? "border-[#e5e5e5] text-[#d4d4d8]"
                    : "border-transparent text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                Video Generation
                <span className="ml-2 rounded-full border border-[#a1a1aa]/25 bg-[#202020] px-2 py-1 text-xs text-[#d4d4d8]">
                  Coming Soon
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="prompt" className="dpai-label mb-2 block">
                Prompt
              </label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="dpai-input w-full resize-none"
                placeholder={
                  activeTab === "image"
                    ? "Describe the image you want to generate..."
                    : "Describe the video you want to generate..."
                }
              />
            </div>

            {activeTab === "image" ? (
              <div className="mb-4">
                <label className="dpai-label mb-2 block">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                  {(["1:1", "16:9", "9:16", "4:3", "3:4"] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        aspectRatio === ratio
                          ? "border-[#e5e5e5] bg-[#202020] text-[#d4d4d8]"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="dpai-primary-btn w-full py-3"
            >
              {loading ? "Generating..." : `Generate ${activeTab === "image" ? "Image" : "Video"}`}
            </button>

            <p className="mt-2 text-center text-sm text-white/45">
              Cost: {activeTab === "image" ? "1 credit" : "10 credits"} per generation
            </p>
          </div>
        </section>

        {error ? (
          <section className="mb-6 rounded-xl border border-[#ff4b4b]/40 bg-[#2a1010] p-4">
            <h2 className="text-sm font-semibold text-[#ffb3b3]">Generation Failed</h2>
            <p className="mt-1 text-sm text-[#ffb3b3]/85">{error}</p>
          </section>
        ) : null}

        {result ? (
          <section className="dpai-panel p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Result</h2>

            {result.status === "coming_soon" ? (
              <div className="rounded-xl border border-[#a1a1aa]/25 bg-[#202020] p-6 text-center">
                <div className="mb-4 text-xl font-semibold text-[#d4d4d8]">AI</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{result.message}</h3>
                <p className="text-white/60">We're working hard to bring video generation to you. Stay tuned.</p>
              </div>
            ) : null}

            {result.success && result.type === "image" && result.url ? (
              <div>
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <Image src={result.url} alt={result.prompt} width={800} height={800} className="h-auto w-full" />
                </div>
                <div className="space-y-2 text-sm text-white/60">
                  <p>
                    <span className="font-medium text-white/80">Prompt:</span> {result.prompt}
                  </p>
                  <p>
                    <span className="font-medium text-white/80">Credits Used:</span> {result.creditsUsed}
                  </p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[#d4d4d8] hover:text-[#f1f1f1]"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
