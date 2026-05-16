"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface CreditLog {
  id: string;
  action: string;
  amount: number;
  createdAt: string;
}

const creditLogs: CreditLog[] = [
  { id: "log-1", action: "AI Photo Optimization", amount: -8, createdAt: "2026-02-28 21:34" },
  { id: "log-2", action: "Monthly Plan Renewal", amount: +1000, createdAt: "2026-02-01 09:02" },
  { id: "log-3", action: "AI Photo Optimization", amount: -2, createdAt: "2026-01-31 17:10" },
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
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
      <div className="p-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
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
  const [credits, setCredits] = useState<number>(0);
  const [nameValue, setNameValue] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [loadingRecharge, setLoadingRecharge] = useState(false);

  useEffect(() => {
    setNameValue(displayName);
  }, [displayName]);

  useEffect(() => {
    let cancelled = false;

    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/user/stats", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!cancelled) {
          setCredits(Number(data?.credits ?? 0));
        }
      } catch {
        if (!cancelled) {
          setCredits(0);
        }
      }
    };

    void fetchCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveName = async () => {
    const nextName = nameValue.trim();
    if (!user || nextName.length < 3 || nextName.length > 30) {
      alert("Please use 3-30 characters for your name.");
      return;
    }

    try {
      setSavingName(true);
      await user.update({ firstName: nextName, lastName: "" });
      await user.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleRechargeCredits = async () => {
    try {
      setLoadingRecharge(true);
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "credits_popular" }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (!window.Paddle) {
        throw new Error("Paddle checkout is still loading. Please try again in a moment.");
      }

      window.Paddle?.Checkout.open({
        items: [{ priceId: data.paddlePriceId, quantity: 1 }],
        customData: data.customData,
        customer: data.email ? { email: data.email } : undefined,
        settings: {
          successUrl: `${window.location.origin}/workspace/account?success=true&orderId=${data.orderId}`,
        },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start checkout.");
    } finally {
      setLoadingRecharge(false);
    }
  };

  return (
    <>
      <header className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">Settings</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-white/55">Manage your account information</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <ProfileCard
            title="Name"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/45">Please use 3-30 characters for your name</span>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0e1213] hover:bg-white/90 disabled:opacity-50"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
            }
          >
            <p className="text-white/55">Please enter your display name</p>
            <input
              type="text"
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              className="mt-4 w-full rounded-lg border border-white/10 bg-[#151515] px-4 py-3 text-white outline-none transition focus:border-[#a1a1aa]/70"
            />
          </ProfileCard>

          <ProfileCard
            title="Avatar"
            footer={<span className="text-sm text-white/45">Avatar upload is currently hidden.</span>}
          >
            <p className="text-white/55">Your account avatar is managed by your sign-in provider.</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e5e5e5]/35 bg-[#151515] text-xl font-semibold text-[#d4d4d8]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </ProfileCard>
        </div>

        <aside className="space-y-5">
          <article className="rounded-xl border border-[rgba(255,255,255,0.12)]/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(13,18,24,0.95))] p-5">
            <p className="text-sm uppercase tracking-[0.08em] text-[#a1a1aa]">Credits</p>
            <p className="mt-2 text-base font-semibold leading-none tracking-tight text-white">
              {credits.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-white/55">Current available balance</p>
            <button
              type="button"
              onClick={handleRechargeCredits}
              disabled={loadingRecharge}
              className="mt-4 w-full rounded-md bg-[#e5e5e5] px-4 py-2.5 text-sm font-semibold text-[#0e1213] transition hover:bg-[#f1f1f1] disabled:opacity-50"
            >
              {loadingRecharge ? "Starting checkout..." : "Recharge Credits"}
            </button>
          </article>

          <article className="rounded-xl border border-white/10 bg-[#121212] p-5">
            <h3 className="text-lg font-semibold">Account Info</h3>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <p className="break-all">{email}</p>
              <p>Plan: Standard</p>
              <p>Status: Active</p>
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Recent Credit Activity</h3>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-white/45">
                Example activity
              </span>
            </div>
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
