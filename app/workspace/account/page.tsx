"use client";

import { useUser } from "@clerk/nextjs";

interface CreditLog {
  id: string;
  action: string;
  amount: number;
  createdAt: string;
}

const creditLogs: CreditLog[] = [
  { id: "log-1", action: "Image to Video Generation", amount: -8, createdAt: "2026-02-28 21:34" },
  { id: "log-2", action: "Monthly Plan Renewal", amount: +1000, createdAt: "2026-02-01 09:02" },
  { id: "log-3", action: "Image Generation", amount: -2, createdAt: "2026-01-31 17:10" },
];

function ProfileCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1319]">
      <div className="p-5">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
      {footer ? <div className="border-t border-white/10 bg-white/[0.03] p-4">{footer}</div> : null}
    </article>
  );
}

export default function WorkspaceAccountPage() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || "lin ge";
  const email = user?.primaryEmailAddress?.emailAddress || "gelinlandao2000@gmail.com";

  return (
    <>
      <header className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-white/55">Manage your account information</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <ProfileCard
            title="Name"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/45">Please use 3-30 characters for your name</span>
                <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0e1213] hover:bg-white/90">
                  Save
                </button>
              </div>
            }
          >
            <p className="text-white/55">Please enter your display name</p>
            <input
              type="text"
              defaultValue={displayName}
              className="mt-4 w-full rounded-lg border border-white/10 bg-[#121821] px-4 py-3 text-white outline-none transition focus:border-[#57f06d]/70"
            />
          </ProfileCard>

          <ProfileCard
            title="Avatar"
            footer={<span className="text-sm text-white/45">An avatar is optional but strongly recommended</span>}
          >
            <p className="text-white/55">Click upload button to upload a custom one</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f8ddb] text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Upload Avatar
              </button>
            </div>
          </ProfileCard>
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-[#2a633f]/70 bg-[linear-gradient(180deg,rgba(32,63,43,0.35),rgba(13,18,24,0.95))] p-5">
            <p className="text-sm uppercase tracking-[0.08em] text-[#8ef5a8]">Credits</p>
            <p className="mt-2 font-['Bebas_Neue','Oswald','Arial_Narrow',sans-serif] text-[62px] leading-none tracking-[0.03em] text-white">
              1,248
            </p>
            <p className="mt-1 text-sm text-white/55">Current available balance</p>
            <button className="mt-4 w-full rounded-md bg-[#5ef36f] px-4 py-2.5 text-sm font-semibold text-[#0e1213] transition hover:bg-[#78ff88]">
              Recharge Credits
            </button>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0f1319] p-5">
            <h3 className="text-lg font-semibold">Account Info</h3>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <p className="break-all">{email}</p>
              <p>Plan: Standard</p>
              <p>Status: Active</p>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0f1319] p-5">
            <h3 className="text-lg font-semibold">Recent Credit Activity</h3>
            <div className="mt-3 space-y-3">
              {creditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-white/10 bg-[#0c1118] px-3 py-2">
                  <p className="text-sm text-white/80">{log.action}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                    <span>{log.createdAt}</span>
                    <span className={log.amount >= 0 ? "text-[#79f79a]" : "text-[#ff6f6f]"}>
                      {log.amount >= 0 ? `+${log.amount}` : log.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}

