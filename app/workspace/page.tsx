import Link from "next/link";

function SidebarGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="mt-7">
      <p className="px-4 text-xs uppercase tracking-[0.08em] text-white/35">
        {title}
      </p>
      <div className="mt-2 space-y-1 px-2">
        {items.map((item, index) => (
          <button
            key={item}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
              index === 0 && title === "Tools"
                ? "bg-white/10 text-white"
                : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-[#0f1319] p-4">
      <p className="text-xs uppercase tracking-[0.08em] text-white/45">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Dot({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full border ${
        active
          ? "border-[#5cf275] bg-[#5cf275]"
          : "border-white/45 bg-transparent"
      }`}
    />
  );
}

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-[#06090e] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 bg-[#080b10] lg:w-[280px] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-4 py-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#50e7cf]">S</span>
              <span className="text-3xl font-semibold tracking-tight">
                Seedance 2.0
              </span>
            </div>
          </div>

          <SidebarGroup
            title="Tools"
            items={[
              "AI Video",
              "Text to Video",
              "Image to Video",
              "Reference to Video",
              "AI Image",
              "My Creations",
            ]}
          />

          <SidebarGroup
            title="Account"
            items={["Account", "Pricing", "Help & Feedback"]}
          />

          <div className="px-3 pb-4 pt-8 lg:absolute lg:bottom-0 lg:w-[280px]">
            <div className="rounded-xl border border-white/10 bg-[#0f1319] px-3 py-3">
              <p className="text-sm text-white/80">lin ge</p>
              <p className="text-xs text-white/45">
                {"\u5de5\u4f5c\u53f0\u5f00\u53d1\u4e2d..."}
              </p>
            </div>
          </div>
        </aside>

        <section className="flex-1 p-4 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#090c12] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-semibold tracking-tight">
                  Image to Video
                </h1>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Prompt Enhancement
                </span>
              </div>

              <SettingCard title="Prompt">
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-base text-white/55">
                  Describe the video you want to create...
                </div>
              </SettingCard>

              <SettingCard title="Image (1-2 images)">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center text-white/55">
                    <p className="mb-1 text-xs text-white/40">First Frame</p>
                    Click to upload
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center text-white/55">
                    <p className="mb-1 text-xs text-white/40">Last Frame</p>
                    Click to upload
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Settings">
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span>Model</span>
                    <span>Seedance 1.5</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-white/45">Ratio</span>
                    <div className="flex items-center gap-2">
                      <Dot />
                      <span>auto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dot active />
                      <span>16:9</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dot />
                      <span>9:16</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-white/45">Duration</span>
                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
                      5s
                    </div>
                    <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/55">
                      10s
                    </div>
                  </div>
                </div>
              </SettingCard>
            </div>

            <div className="space-y-4">
              <div className="aspect-[16/9] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(121,170,96,0.35),rgba(16,20,28,0.92)_65%)] p-4">
                <div className="h-full rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="inline-block rounded-md bg-black/40 px-2 py-1 text-xs text-white/70">
                    {"\u9884\u89c8\u753b\u9762 01"}
                  </p>
                </div>
              </div>

              <div className="aspect-[16/9] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_10%,rgba(158,112,65,0.35),rgba(16,20,28,0.92)_65%)] p-4">
                <div className="h-full rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="inline-block rounded-md bg-black/40 px-2 py-1 text-xs text-white/70">
                    {"\u9884\u89c8\u753b\u9762 02"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0b0f15] px-4 py-3 text-center text-sm text-white/65">
                {"\u5de5\u4f5c\u53f0\u5f00\u53d1\u4e2d..."}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#2a4732] bg-[#0b1310] px-4 py-3 text-sm text-[#97f0aa]">
            <span>
              {
                "\u767b\u5f55\u6210\u529f\u540e\u5df2\u8fdb\u5165\u5de5\u4f5c\u53f0\u57fa\u7840\u8def\u7531 /workspace"
              }
            </span>
            <Link
              href="/dashboard"
              className="rounded-md border border-[#3c7f50] px-3 py-1 text-[#a6f5b4] transition hover:bg-[#1a3624]"
            >
              {"\u524d\u5f80\u65e7\u7248 Dashboard"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

