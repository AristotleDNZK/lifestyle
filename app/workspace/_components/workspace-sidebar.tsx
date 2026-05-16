"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

type NavItem = {
  label: string;
  href?: string;
  match?: "exact" | "prefix";
  indent?: boolean;
  external?: boolean;
};

const toolItems: NavItem[] = [
  {
    label: "AI Photo Optimization",
    href: "/workspace/image-to-image",
    match: "prefix",
  },
  { label: "My Creations", href: "/workspace/my-creations", match: "prefix" },
];

const accountItems: NavItem[] = [
  { label: "Account", href: "/workspace/account", match: "prefix" },
  { label: "Pricing", href: "/workspace/pricing", match: "prefix" },
  { label: "Help & Feedback", href: "mailto:support@datingphotosai.com", external: true },
];

function isActive(
  pathname: string,
  href?: string,
  mode: NavItem["match"] = "prefix"
) {
  if (!href) return false;
  if (mode === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = isActive(pathname, item.href, item.match);
  const baseClass =
    "flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors";
  const activeClass = active
    ? "bg-[#1a1a1a] text-white"
    : "text-white/60 hover:bg-[#1b1b1c] hover:text-white";

  if (item.external && item.href) {
    return (
      <a
        href={item.href}
        className={`${baseClass} ${activeClass} ${
          item.indent ? "pl-8" : ""
        }`}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-white/45">
          *
        </span>
        <span className="ml-2">{item.label}</span>
      </a>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      className={`${baseClass} ${activeClass} ${item.indent ? "pl-8" : ""}`}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-white/45">
        *
      </span>
      <span className="ml-2">{item.label}</span>
    </Link>
  );
}

function SidebarGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mt-7">
      <p className="px-4 text-xs uppercase tracking-[0.08em] text-white/35">
        {title}
      </p>
      <div className="mt-2 space-y-1 px-2">
        {items.map((item) => (
          <SidebarItem key={item.label} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="relative w-full border-b border-white/10 bg-[#101010] lg:w-[272px] lg:border-b-0 lg:border-r">
      <div className="border-b border-white/10 px-4 py-5">
        <Link href="/workspace/image-to-image" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-[#e5e5e5]">D</span>
          <span className="text-base font-semibold text-white">
            DatingPhotosAI
          </span>
        </Link>
      </div>

      <SidebarGroup title="Tools" items={toolItems} pathname={pathname} />
      <SidebarGroup title="Account" items={accountItems} pathname={pathname} />

      <div className="px-3 pb-4 pt-8 lg:absolute lg:bottom-0 lg:w-[272px]">
        <div className="rounded-xl border border-white/10 bg-[#121212] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-white/90">
                {user?.fullName || user?.firstName || "User"}
              </p>
              <p className="truncate text-xs text-white/45">
                {user?.primaryEmailAddress?.emailAddress || "account@datingphotosai.com"}
              </p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-[#121212] px-3 py-3">
          <p className="text-sm font-semibold text-white">Upgrade</p>
          <p className="mt-1 text-xs text-white/55">
            Get more credits and faster generation.
          </p>
          <Link
            href="/workspace/pricing"
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white/85 transition hover:border-white/20 hover:bg-[#1b1b1c]"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </aside>
  );
}
