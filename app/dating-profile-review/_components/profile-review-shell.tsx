"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ProfileReviewLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex -skew-x-12 bg-[#63f276] px-3 py-1 shadow-[0_0_28px_rgba(99,242,118,0.28)]"
    >
      <span className="skew-x-12 text-sm font-black uppercase tracking-[0.18em] text-[#071009]">
        DatingPhotosAI
      </span>
    </Link>
  );
}

export function ProfileReviewPrimaryButton({
  children,
  type = "button",
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes(
        "inline-flex min-h-[56px] w-full items-center justify-center rounded-sm bg-[#63f276] px-6 text-base font-black uppercase tracking-[0.06em] text-[#081009] transition",
        "hover:bg-[#79ff8d] disabled:cursor-not-allowed disabled:bg-[#2d4f34] disabled:text-white/45",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ProfileReviewSecondaryButton({
  children,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes(
        "inline-flex min-h-[56px] w-full items-center justify-center rounded-sm border border-white/18 bg-transparent px-6 text-base font-bold uppercase tracking-[0.05em] text-white transition",
        "hover:border-[#63f276]/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/8 disabled:text-white/30",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ProfileReviewShell({
  theme = "black",
  progress,
  showBack,
  onBack,
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  children,
  footer,
}: {
  theme?: "black" | "green";
  progress?: number;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const greenTheme = theme === "green";

  return (
    <div
      className={classes(
        "relative min-h-screen overflow-hidden px-5 py-6 text-white sm:px-6",
        greenTheme ? "bg-[#022a14]" : "bg-[#030303]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,242,118,0.09),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col">
        <div className="flex min-h-[52px] items-center justify-between">
          <div className="w-12">
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80 transition hover:border-white/20 hover:bg-white/10"
                aria-label="Go back"
              >
                {"<"}
              </button>
            ) : null}
          </div>
          <ProfileReviewLogo href="/" />
          <div className="w-12" />
        </div>

        {typeof progress === "number" ? (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#f1e7de] transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(progress, 1)) * 100}%` }}
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col">
          {heroTitle ? (
            <div className="mx-auto mt-16 max-w-2xl text-center sm:mt-24">
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-[#f7efe7] sm:text-6xl">
                {heroTitle}
              </h1>
              {heroSubtitle ? (
                <p className="mt-4 text-lg text-white/60 sm:text-2xl">
                  {heroSubtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          {title ? (
            <div
              className={classes(
                "mx-auto max-w-2xl text-center",
                heroTitle ? "mt-16 sm:mt-20" : "mt-20 sm:mt-28"
              )}
            >
              <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.02em] text-[#f7efe7] sm:text-5xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/62 sm:text-xl">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            className={classes(
              "mx-auto w-full max-w-2xl",
              title || heroTitle ? "mt-10 sm:mt-12" : "mt-20"
            )}
          >
            {children}
          </div>
        </div>

        {footer ? <div className="pt-8">{footer}</div> : null}
      </div>
    </div>
  );
}
