"use client";

import { useEffect, useState, type ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function inferImageExtension(imageUrl: string) {
  const cleanUrl = imageUrl.split(/[?#]/)[0] || "";
  const match = cleanUrl.match(/\.([a-z0-9]{2,5})$/i);

  return match?.[1]?.toLowerCase() || "png";
}

export function buildWorkspaceImageDownloadName(params: {
  label?: string | null;
  imageUrl: string;
  fallback: string;
}) {
  const slug = sanitizeSlug(params.label || "");
  const extension = inferImageExtension(params.imageUrl);

  return `${slug || params.fallback}.${extension}`;
}

function ActionIcon({ kind }: { kind: "download" | "expand" | "close" }) {
  if (kind === "download") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "expand") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 7 17 17M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

async function downloadImageAsset(imageUrl: string, downloadName: string) {
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    anchor.href = objectUrl;
    anchor.download = downloadName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    anchor.href = imageUrl;
    anchor.download = downloadName;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
  }
}

function WorkspaceImageLightbox({
  imageUrl,
  imageAlt,
  downloadName,
  onClose,
}: {
  imageUrl: string;
  imageAlt: string;
  downloadName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/86 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={imageAlt}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute right-0 top-0 z-10 flex items-center gap-2 p-3">
          <button
            type="button"
            onClick={() => void downloadImageAsset(imageUrl, downloadName)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-black/70"
          >
            <ActionIcon kind="download" />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition hover:border-white/30 hover:bg-black/70"
            aria-label="Close full image preview"
          >
            <ActionIcon kind="close" />
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#070a0f] shadow-[0_28px_120px_rgba(0,0,0,0.55)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-[82vh] w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceImageActionOverlay({
  children,
  imageUrl,
  imageAlt,
  downloadName,
  viewLabel = "View full image",
  className,
  actionsClassName,
  actionsPlacement = "top",
}: {
  children: ReactNode;
  imageUrl: string;
  imageAlt: string;
  downloadName: string;
  viewLabel?: string;
  className?: string;
  actionsClassName?: string;
  actionsPlacement?: "top" | "bottom";
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <div className={classes("group relative overflow-hidden", className)}>
        {children}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/24 to-black/12 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />

        <div
          className={classes(
            "pointer-events-none absolute inset-x-3 z-10 flex justify-end gap-2 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
            actionsPlacement === "bottom" ? "bottom-3" : "top-3",
            actionsClassName
          )}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void downloadImageAsset(imageUrl, downloadName);
            }}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/65 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/32 hover:bg-black/80"
            aria-label={`Download ${imageAlt} as ${downloadName}`}
            title="Download"
          >
            <ActionIcon kind="download" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/65 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/32 hover:bg-black/80"
            aria-label={`${viewLabel}: ${imageAlt}`}
            title={viewLabel}
          >
            <ActionIcon kind="expand" />
            <span>{viewLabel}</span>
          </button>
        </div>
      </div>

      {isLightboxOpen ? (
        <WorkspaceImageLightbox
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          downloadName={downloadName}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
