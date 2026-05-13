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
        active ? "border-[#5cf275] bg-[#5cf275]" : "border-white/45 bg-transparent"
      }`}
    />
  );
}

export default function WorkspacePage() {
  return (
    <>
      <header className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Studio</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">DatingPhotosAI Studio</h1>
        <p className="mt-1 text-white/55">
          Optimize uploaded photos for dating profiles and review your generated results.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#090c12] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">AI 照片优化</h2>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              Active Tool
            </span>
          </div>

          <SettingCard title="Workflow">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-base text-white/55">
              Upload a source photo, keep the default optimization prompt or add your own direction, then generate improved dating profile photos.
            </div>
          </SettingCard>

          <SettingCard title="Photo Inputs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center text-white/55">
                <p className="mb-1 text-xs text-white/40">Source Photo</p>
                Click to upload
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center text-white/55">
                <p className="mb-1 text-xs text-white/40">Reference Style</p>
                Optional
              </div>
            </div>
          </SettingCard>

          <SettingCard title="Settings">
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span>Model</span>
                <span>AI Photo Optimizer</span>
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
                <span className="text-white/45">Output</span>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">Natural</div>
                <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/55">Profile-ready</div>
              </div>
            </div>
          </SettingCard>
        </div>

        <div className="space-y-4">
          <div className="aspect-[16/9] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(121,170,96,0.35),rgba(16,20,28,0.92)_65%)] p-4">
            <div className="h-full rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="inline-block rounded-md bg-black/40 px-2 py-1 text-xs text-white/70">Preview Frame 01</p>
            </div>
          </div>

          <div className="aspect-[16/9] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_10%,rgba(158,112,65,0.35),rgba(16,20,28,0.92)_65%)] p-4">
            <div className="h-full rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="inline-block rounded-md bg-black/40 px-2 py-1 text-xs text-white/70">Preview Frame 02</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#2a4732] bg-[#0b1310] px-4 py-3 text-sm text-[#97f0aa]">
            Workspace home is ready. Use the left navigation to open AI 照片优化, My Creations, Pricing, or Account.
          </div>
        </div>
      </div>
    </>
  );
}

