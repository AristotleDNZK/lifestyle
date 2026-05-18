"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  WorkspaceImageActionOverlay,
  buildWorkspaceImageDownloadName,
} from "../_components/workspace-image-actions";
import { DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT } from "@/lib/ai-photo-optimization";
import {
  MAX_OPTIMIZATION_IMAGE_BYTES,
  MAX_OPTIMIZATION_IMAGE_EDGE,
  compressImageToDataUrl,
} from "@/lib/client-image-compression";
import { pollGenerationJob } from "@/lib/generation-jobs";

type Ratio = "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9";

type StoredImage = {
  id: string;
  name: string;
  dataUrl: string;
};

type HistoryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  modelId: string;
  ratio: string;
  createdAt: string;
};

type HistoryResponse = {
  data?: Array<{
    id: string;
    url: string | null;
    image_url?: string | null;
    prompt: string | null;
    model?: string | null;
    model_id?: string | null;
    model_name?: string | null;
    aspect_ratio?: string | null;
    created_at?: string | null;
  }>;
  totalPages?: number;
  error?: string;
};

type ModelOption = {
  id: string;
  label: string;
  cost: number;
  note: string;
};

const MODELS: ModelOption[] = [
  {
    id: "auto",
    label: "Auto Balanced (?? 3)",
    cost: 3,
    note: "Balanced mode for most scenarios.",
  },
  {
    id: "standard",
    label: "Standard / Fast (?? 2)",
    cost: 2,
    note: "Lower cost and faster generation.",
  },
  {
    id: "pro",
    label: "Pro / High Quality (?? 4)",
    cost: 4,
    note: "Higher quality output for complex prompts.",
  },
];
const RATIO_OPTIONS: { value: Ratio; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
];

type ExampleItem = {
  id: string;
  imageUrl: string;
  prompt: string;
};

// Fallback examples (always present). Real examples can be synced into
// `/public/example_image` via `node scripts/sync-example-images.js`.
const FALLBACK_EXAMPLES: ExampleItem[] = [
  {
    id: "ex-1",
    imageUrl: "/homepage/gallery-street.png",
    prompt:
      "Change the background to a sunset beach, warm cinematic lighting, add subtle film grain.",
  },
  {
    id: "ex-2",
    imageUrl: "/homepage/gallery-woman.png",
    prompt:
      "Make it look like a professional studio portrait, softbox lighting, clean background, sharper details.",
  },
  {
    id: "ex-3",
    imageUrl: "/homepage/gallery-suit.png",
    prompt:
      "Convert to anime style, vibrant colors, smooth shading, keep facial identity consistent.",
  },
  {
    id: "ex-4",
    imageUrl: "/homepage/gallery-man.png",
    prompt:
      "Add more contrast and clarity, enhance skin tones naturally, reduce noise, crisp edges.",
  },
  {
    id: "ex-5",
    imageUrl: "/homepage/gallery-couch.png",
    prompt:
      "Replace outfit with a black suit, luxury look, dramatic rim light, high-end editorial style.",
  },
  {
    id: "ex-6",
    imageUrl: "/homepage/gallery-dinner.png",
    prompt:
      "Turn into a cozy cafe scene, warm indoor lights, bokeh background, candid vibe.",
  },
];

const WORKSPACE_HISTORY_LOAD_WARNING =
  "[AIPhotoOptimization] Initial history load failed";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function Icon({
  name,
  className,
}: {
  name:
    | "upload"
    | "sparkles"
    | "clock"
    | "wand"
    | "bolt"
    | "image"
    | "x"
    | "empty";
  className?: string;
}) {
  const c = className || "h-4 w-4";
  switch (name) {
    case "upload":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M12 15V4m0 0 4 4m-4-4-4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 15.5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M12 2l1.2 4.8L18 8l-4.8 1.2L12 14l-1.2-4.8L6 8l4.8-1.2L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5 13l.7 2.8L8.5 16l-2.8.7L5 19.5l-.7-2.8L1.5 16l2.8-.7L5 13Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M19 13l.7 2.8L22.5 16l-2.8.7L19 19.5l-.7-2.8L15.5 16l2.8-.7L19 13Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "wand":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M4 20 14.8 9.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M12.7 6.2 17.8 11.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M14.9 4.1 16 2l1.1 2.1L19.2 5l-2.1 1.1L16 8.2l-1.1-2.1L12.8 5l2.1-.9Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M13 2 4 14h7l-1 8 10-14h-7l1-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 11.5 10.5 14l3-3 2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M9 9.25a.75.75 0 1 0 0 .01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M7 7l10 10M17 7 7 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "empty":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" aria-hidden="true">
          <path
            d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8.5 9h7M8.5 12h7M8.5 15h5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function formatDateLabel(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function parseDataUrl(dataUrl: string) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mimeType: m[1] || "image/jpeg", base64: m[2] || "" };
}

async function imageUrlToStoredImage(item: HistoryItem): Promise<StoredImage> {
  const response = await fetch(item.imageUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load selected creation.");
  }

  const blob = await response.blob();
  const dataUrl = await compressImageToDataUrl(blob);

  return {
    id: uid("creation"),
    name: `creation-${item.id}.jpg`,
    dataUrl,
  };
}

async function optimizeStoredImage(image: StoredImage): Promise<StoredImage | null> {
  if (!parseDataUrl(image.dataUrl)) return null;

  const response = await fetch(image.dataUrl);
  const blob = await response.blob();

  return {
    ...image,
    dataUrl: await compressImageToDataUrl(blob),
  };
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function useSessionStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const raw = sessionStorage.getItem(key);
    setValue(safeJsonParse<T>(raw, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!didInit.current) return;
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function PillTab({
  active,
  label,
  onClick,
  iconName,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  iconName: "clock" | "sparkles";
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className={active ? "text-white/85" : "text-white/55"}>
        <Icon name={iconName} className="h-4 w-4" />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function UploadZone({
  images,
  setImages,
  onOpenCreations,
}: {
  images: StoredImage[];
  setImages: (next: StoredImage[]) => void;
  onOpenCreations: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 5 - images.length);
    const readOne = async (file: File): Promise<StoredImage> => ({
      id: uid("img"),
      name: file.name,
      dataUrl: await compressImageToDataUrl(file),
    });

    const results: StoredImage[] = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) continue;
      try {
        results.push(await readOne(file));
      } catch {
        // ignore single file failure
      }
    }

    if (results.length) setImages([...images, ...results].slice(0, 5));
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) await addFiles(e.dataTransfer.files);
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files = items
      .map((it) => (it.kind === "file" ? it.getAsFile() : null))
      .filter(Boolean) as File[];
    if (files.length) await addFiles(files);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#101010] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white/80">Image</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
        className={`mt-3 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 text-center outline-none transition ${
          dragOver ? "border-[#a1a1aa]/70 bg-[#0b1310]" : "hover:bg-black/30"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
          <Icon name="upload" className="h-6 w-6" />
        </div>
        <p className="mt-3 text-base font-medium text-white/80">
          Upload up to 5 images
        </p>
        <p className="mt-1 text-sm text-white/45">
          Multi-select, drag and drop, or paste
        </p>
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-white/85 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreations();
          }}
        >
          Select from My Creations
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length ? (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/30"
              title={img.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={img.name} className="h-16 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((x) => x.id !== img.id))}
                className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80 opacity-0 transition group-hover:opacity-100"
              >
                <span className="inline-flex items-center justify-center">
                  <Icon name="x" className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CreationPickerModal({
  open,
  loading,
  history,
  currentImages,
  onClose,
  onImport,
}: {
  open: boolean;
  loading: boolean;
  history: HistoryItem[];
  currentImages: StoredImage[];
  onClose: () => void;
  onImport: (items: HistoryItem[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
    }
  }, [open]);

  if (!open) return null;

  const remainingSlots = Math.max(0, 5 - currentImages.length);
  const selectedItems = history.filter((item) => selectedIds.includes(item.id));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Select from My Creations
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Import up to {remainingSlots} images into AI Photo Optimization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            aria-label="Close"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[520px] overflow-auto p-5">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
              Loading images...
            </div>
          ) : !history.length ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
              No image creations yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {history.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedIds((current) => {
                        if (current.includes(item.id)) {
                          return current.filter((id) => id !== item.id);
                        }
                        if (current.length >= remainingSlots) {
                          return current;
                        }
                        return [...current, item.id];
                      });
                    }}
                    className={`overflow-hidden rounded-xl border text-left transition ${
                      selected
                        ? "border-[#d4d4d8]/70 bg-white/10"
                        : "border-white/10 bg-black/25 hover:border-white/25"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.prompt || "Creation"}
                      className="h-32 w-full object-cover"
                    />
                    <p className="line-clamp-2 px-3 py-2 text-xs text-white/60">
                      {item.prompt || "Untitled image"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-xs text-white/45">
            {selectedItems.length} selected
          </span>
          <button
            type="button"
            onClick={() => onImport(selectedItems)}
            disabled={!selectedItems.length || remainingSlots <= 0}
            className="rounded-lg bg-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0b0d10] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Import selected
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 rounded-full border transition ${
        checked
          ? "border-[#a1a1aa]/60 bg-[#202020]"
          : "border-white/15 bg-white/5"
      }`}
    >
      <span
        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition ${
          checked ? "left-[26px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingsPanel({
  showAdvancedOptions,
  setShowAdvancedOptions,
  modelId,
  setModelId,
  ratio,
  setRatio,
  multiShot,
  setMultiShot,
}: {
  showAdvancedOptions: boolean;
  setShowAdvancedOptions: (v: boolean) => void;
  modelId: string;
  setModelId: (v: string) => void;
  ratio: Ratio;
  setRatio: (v: Ratio) => void;
  multiShot: boolean;
  setMultiShot: (v: boolean) => void;
}) {
  const selected = useMemo(
    () => MODELS.find((m) => m.id === modelId) || MODELS[0],
    [modelId]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#101010] p-4 sm:p-5">
      <button
        type="button"
        aria-expanded={showAdvancedOptions}
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-white/80">
            Advanced Options
          </p>
          <p className="mt-1 text-xs text-white/45">
            Model quality, aspect ratio, and variation controls.
          </p>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
          {showAdvancedOptions ? "Collapse" : "Expand"}
        </span>
      </button>

      {showAdvancedOptions && (
        <div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.1em] text-white/40">
              Model
            </p>
            <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full appearance-none rounded-md bg-[#101010] text-sm text-white outline-none [color-scheme:dark] focus:ring-0"
              >
                {MODELS.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className="bg-[#101010] text-white"
                  >
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-white/45">{selected.note}</p>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.1em] text-white/40">
              Ratio
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              {RATIO_OPTIONS.map((opt) => {
                const active = opt.value === ratio;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRatio(opt.value)}
                    className="group inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
                  >
                    <span
                      className={`relative h-4 w-4 rounded-full border transition ${
                        active
                          ? "border-white/70"
                          : "border-white/30 group-hover:border-white/45"
                      }`}
                    >
                      <span
                        className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                          active ? "bg-white" : "bg-transparent"
                        }`}
                      />
                    </span>
                    <span className={active ? "text-white" : ""}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white/80">
                  Multi-Shot Generation
                </p>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                  Beta
                </span>
              </div>
              <p className="mt-1 text-xs text-white/45">
                Generate multiple variations from the same inputs.
              </p>
            </div>
            <Toggle checked={multiShot} onChange={setMultiShot} />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryGallery({
  history,
  loading,
  selectedId,
  onSelect,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  history: HistoryItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[#a1a1aa]" />
          Generating...
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">
          <Icon name="empty" className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-semibold text-white/70">
          No images generated yet
        </p>
        <p className="mt-1 text-xs text-white/45">
          Optimize a photo to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {history.map((item) => {
          const imageAlt = item.prompt?.trim() || "Generated image result";
          const downloadName = buildWorkspaceImageDownloadName({
            label: item.prompt,
            imageUrl: item.imageUrl,
            fallback: `image-to-image-${item.id}`,
          });

          return (
            <article
              key={item.id}
              className={`group overflow-hidden rounded-xl border bg-black/20 transition ${
                selectedId === item.id
                  ? "border-[#a1a1aa]/55 "
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <WorkspaceImageActionOverlay
                imageUrl={item.imageUrl}
                imageAlt={imageAlt}
                downloadName={downloadName}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="block w-full text-left"
                  title="Click to preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={imageAlt}
                    className="h-40 w-full object-cover"
                  />
                </button>
              </WorkspaceImageActionOverlay>
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold text-white/85">
                  {item.prompt || "No prompt"}
                </p>
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>{item.ratio.toUpperCase()}</span>
                  <span>{item.createdAt}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 1}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <span className="text-xs text-white/60">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ExamplesGallery({
  onUsePrompt,
  examples,
  source,
  onSelect,
  selectedId,
}: {
  onUsePrompt: (prompt: string) => void;
  examples: ExampleItem[];
  source: "fallback" | "manifest";
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  return (
    <div className="p-5">
      {source === "fallback" ? (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/65">
          Using fallback examples. Run{" "}
          <span className="font-semibold text-white/80">
            node scripts/sync-example-images.js
          </span>{" "}
          to load images from <span className="font-semibold">/example_image</span>{" "}
          into <span className="font-semibold">/public/example_image</span>.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {examples.map((ex) => {
          const selected = selectedId === ex.id;
          return (
            <article
              key={ex.id}
              className={`group overflow-hidden rounded-xl border bg-black/20 transition ${
                selected
                  ? "border-[#a1a1aa]/55 "
                  : "border-white/10 hover:border-[#a1a1aa]/50 "
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(ex.id)}
                className="block w-full text-left"
                title="Click to preview"
              >
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ex.imageUrl}
                    alt="example"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
              </button>
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => onUsePrompt(ex.prompt)}
                  className="text-left text-sm text-white/80 transition hover:text-white"
                  title="Click to use this prompt"
                >
                  {ex.prompt}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PreviewStage({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  downloadName,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  imageAlt: string;
  downloadName: string | null;
}) {
  return (
    <div className="px-5 pt-5">
      <div className="sr-only">
        {title} {subtitle}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <div className="relative h-[520px] w-full bg-[radial-gradient(circle_at_35%_15%,rgba(255,255,255,0.06),rgba(0,0,0,0)_55%)]">
          {imageUrl && downloadName ? (
            <WorkspaceImageActionOverlay
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              downloadName={downloadName}
              className="h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={imageAlt}
                className="h-full w-full object-cover"
              />
            </WorkspaceImageActionOverlay>
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">
                <Icon name="image" className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white/70">
                Nothing to preview
              </p>
              <p className="mt-1 text-xs text-white/45">
                Select an example or generate a new result.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImageToImagePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [uploadedImages, setUploadedImages] = useSessionStorageState<
    StoredImage[]
  >("i2i_uploadedImages", []);
  const [prompt, setPrompt] = useSessionStorageState<string>("i2i_prompt", "");
  const [selectedModel, setSelectedModel] = useSessionStorageState<string>(
    "i2i_model",
    MODELS[0].id
  );
  const [ratio, setRatio] = useSessionStorageState<Ratio>("i2i_ratio", "auto");
  const [multiShot, setMultiShot] = useSessionStorageState<boolean>(
    "i2i_multiShot",
    false
  );
  const [activeTab, setActiveTab] = useSessionStorageState<"history" | "examples">(
    "i2i_tab",
    "examples"
  );
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [credits, setCredits] = useState<number>(0);
  const [selectedExampleId, setSelectedExampleId] = useSessionStorageState<
    string | null
  >("i2i_selectedExampleId", null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCreationPicker, setShowCreationPicker] = useState(false);
  const [toast, setToast] = useState<
    | {
        id: string;
        title: string;
        message?: string;
      }
    | null
  >(null);
  const [examples, setExamples] = useState<ExampleItem[]>(FALLBACK_EXAMPLES);
  const [examplesSource, setExamplesSource] = useState<"fallback" | "manifest">(
    "fallback"
  );

  const model = useMemo(
    () => MODELS.find((m) => m.id === selectedModel) || MODELS[0],
    [selectedModel]
  );
  const cost = model.cost;

  useEffect(() => {
    // If the persisted model is no longer available (after updating the list),
    // reset to a safe default.
    if (!MODELS.some((m) => m.id === selectedModel)) {
      setSelectedModel(MODELS[0].id);
    }
  }, [selectedModel, setSelectedModel]);

  useEffect(() => {
    if (prompt === DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT) {
      setPrompt("");
    }
  }, [prompt, setPrompt]);

  const selectedExample = useMemo(() => {
    const id = selectedExampleId;
    if (!id) return null;
    return examples.find((e) => e.id === id) || null;
  }, [examples, selectedExampleId]);

  const selectedHistory = useMemo(() => {
    const id = selectedHistoryId;
    if (id) return historyData.find((h) => h.id === id) || null;
    return historyData.length ? historyData[0] : null;
  }, [historyData, selectedHistoryId]);

  useEffect(() => {
    // Re-apply persisted language or translation state handled globally.
    // Keep this effect to anchor persistence on route transitions if needed.
    void pathname;
  }, [pathname]);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/stats", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as any;
      const next = Number(data?.credits ?? 0);
      if (!Number.isFinite(next)) return;
      setCredits(next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async (page: number, preferredId?: string | null) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/user/generations?page=${page}&limit=8&type=image`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as HistoryResponse;

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load history.");
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      const normalized: HistoryItem[] = list
        .filter((item) => {
          const url = String(item?.image_url || item?.url || "");
          return url.length > 0 && !url.startsWith("data:image/");
        })
        .map((item) => ({
          id: String(item.id),
          imageUrl: String(item.image_url || item.url || ""),
          prompt: String(item.prompt || ""),
          modelId: String(item.model_id || item.model_name || item.model || ""),
          ratio: String(item.aspect_ratio || "auto"),
          createdAt: formatDateLabel(item.created_at),
        }));

      setHistoryData(normalized);
      setTotalPages(Math.max(1, Number(data?.totalPages || 1)));
      setSelectedHistoryId((prev) =>
        preferredId && normalized.some((x) => x.id === preferredId)
          ? preferredId
          : prev && normalized.some((x) => x.id === prev)
            ? prev
            : normalized[0]?.id || null
      );
    } catch (e: any) {
      console.warn(WORKSPACE_HISTORY_LOAD_WARNING, e);
      setHistoryData([]);
      setTotalPages(1);
      setSelectedHistoryId(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/example_image/examples.json", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data)) return;

        const sanitized: ExampleItem[] = data
          .map((x) => {
            const item = x as Partial<ExampleItem>;
            if (!item?.id || !item?.imageUrl || !item?.prompt) return null;
            return {
              id: String(item.id),
              imageUrl: String(item.imageUrl),
              prompt: String(item.prompt),
            };
          })
          .filter(Boolean) as ExampleItem[];

        if (!sanitized.length) return;
        if (cancelled) return;
        setExamples(sanitized);
        setExamplesSource("manifest");
        setSelectedExampleId((prev) => {
          if (prev && sanitized.some((e) => e.id === prev)) return prev;
          return sanitized[0]!.id;
        });
      } catch {
        // ignore
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "examples") return;
    if (!examples.length) return;
    if (selectedExampleId && examples.some((e) => e.id === selectedExampleId)) {
      return;
    }
    setSelectedExampleId(examples[0]!.id);
  }, [activeTab, examples, selectedExampleId, setSelectedExampleId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const showError = (message: string) => {
    setToast({
      id: uid("toast"),
      title: "1 error",
      message,
    });
  };

  const fetchCreationPickerHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        "/api/user/generations?limit=100&type=image",
        { cache: "no-store" }
      );
      const data = (await res.json()) as HistoryResponse;

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load creations.");
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      const normalized: HistoryItem[] = list
        .filter((item) => {
          const url = String(item?.image_url || item?.url || "");
          return url.length > 0 && !url.startsWith("data:image/");
        })
        .map((item) => ({
          id: String(item.id),
          imageUrl: String(item.image_url || item.url || ""),
          prompt: String(item.prompt || ""),
          modelId: String(item.model_id || item.model_name || item.model || ""),
          ratio: String(item.aspect_ratio || "auto"),
          createdAt: formatDateLabel(item.created_at),
        }));

      setHistoryData(normalized);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to load creations."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const importCreations = async (items: HistoryItem[]) => {
    if (!items.length) return;
    const remainingSlots = Math.max(0, 5 - uploadedImages.length);
    if (remainingSlots <= 0) {
      showError("You can upload up to 5 images.");
      return;
    }

    try {
      const imported: StoredImage[] = [];
      for (const item of items.slice(0, remainingSlots)) {
        imported.push(await imageUrlToStoredImage(item));
      }
      setUploadedImages([...uploadedImages, ...imported].slice(0, 5));
      setShowCreationPicker(false);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to import selected creations."
      );
    }
  };

  const onTransform = async () => {
    if (loading) return;
    if (!uploadedImages.length) {
      showError("Please upload an image first.");
      return;
    }

    let optimizedImages: StoredImage[];
    try {
      optimizedImages = (
        await Promise.all(uploadedImages.map((image) => optimizeStoredImage(image)))
      ).filter(Boolean) as StoredImage[];
    } catch {
      showError("We couldn't prepare your uploaded images. Please re-upload and try again.");
      return;
    }

    if (!optimizedImages.length) {
      showError("Invalid image format. Please re-upload the image.");
      return;
    }

    setUploadedImages(optimizedImages);

    const requestImages = optimizedImages
      .map((image) => {
        const parsed = parseDataUrl(image.dataUrl);
        if (!parsed?.base64) return null;
        return {
          imageMimeType: parsed.mimeType,
          imageBase64: parsed.base64,
        };
      })
      .filter(Boolean) as Array<{
      imageMimeType: string;
      imageBase64: string;
    }>;

    if (!requestImages.length) {
      showError("Invalid image format. Please re-upload the image.");
      return;
    }
    const promptText = (prompt || "").trim() || DEFAULT_AI_PHOTO_OPTIMIZATION_PROMPT;
    const generationCount = multiShot ? 3 : 1;

    // Use real credits from DB. Form state is already persisted via sessionStorage hooks.
    if (credits < cost * generationCount) {
      router.push("/workspace/pricing");
      return;
    }

    setLoading(true);
    try {
      setActiveTab("history");

      const queuedJobIds: string[] = [];

      for (let index = 0; index < generationCount; index++) {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt:
              generationCount > 1
                ? `${promptText}\nVariation ${index + 1}: create a distinct but consistent dating-photo option.`
                : promptText,
            ratio,
            model: selectedModel,
            images: requestImages,
          }),
        });

        if (!res.ok) {
          let msg = `Request failed (${res.status})`;
          try {
            const j = (await res.json()) as any;
            msg = j?.error || j?.message || msg;
          } catch {
            // ignore
          }
          if (res.status === 402) {
            router.push("/workspace/pricing");
            return;
          }
          showError(msg);
          return;
        }

        const data = (await res.json()) as any;
        if (!data?.success || !data?.jobId) {
          showError(data?.error || "Generation job was not queued.");
          return;
        }
        queuedJobIds.push(String(data.jobId));
      }

      void fetchCredits();
      const jobs = await Promise.all(queuedJobIds.map((jobId) => pollGenerationJob(jobId)));
      const lastJob = jobs[jobs.length - 1];
      if (!jobs.some((job) => job.imageUrl)) {
        showError("Generation completed but no image URL was returned.");
        return;
      }

      setCurrentPage(1);
      await fetchHistory(1, lastJob ? String(lastJob.id) : null);
      void fetchCredits();
    } finally {
      setTimeout(() => setLoading(false), 350);
    }
  };

  const stageTitle =
    activeTab === "history" ? "Result Preview" : "Example Preview";
  const stageSubtitle =
    activeTab === "history"
      ? selectedHistory?.prompt || "History"
      : selectedExample?.prompt || "Examples";
  const stageImageUrl =
    activeTab === "history"
      ? selectedHistory?.imageUrl || null
      : selectedExample?.imageUrl || null;
  const stageImageAlt = stageSubtitle.trim() || stageTitle;
  const stageImageDownloadName = stageImageUrl
    ? buildWorkspaceImageDownloadName({
        label: stageSubtitle,
        imageUrl: stageImageUrl,
        fallback:
          activeTab === "history"
            ? `image-to-image-history-${selectedHistoryId || "preview"}`
            : `image-to-image-example-${selectedExampleId || "preview"}`,
      })
    : null;

  return (
    <div className="relative grid gap-5 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <UploadZone
          images={uploadedImages}
          setImages={setUploadedImages}
              onOpenCreations={() => {
                setShowCreationPicker(true);
                setActiveTab("history");
                void fetchCreationPickerHistory();
              }}
            />

        <div className="rounded-xl border border-white/10 bg-[#101010] p-4 sm:p-5">
          <p className="text-sm font-semibold text-white/80">
            Prompt <span className="text-white/35">(optional)</span>
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Leave blank to use the built-in dating photo optimization prompt, or describe the look you want."
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-[#a1a1aa]/60"
          />
        </div>

        <SettingsPanel
          showAdvancedOptions={showAdvancedOptions}
          setShowAdvancedOptions={setShowAdvancedOptions}
          modelId={MODELS.some((m) => m.id === selectedModel) ? selectedModel : MODELS[0].id}
          setModelId={setSelectedModel}
          ratio={ratio}
          setRatio={setRatio}
          multiShot={multiShot}
          setMultiShot={setMultiShot}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#101010] px-5 py-4">
            <div>
              <p className="text-xs text-white/55">
                Credits:{" "}
                <span className="font-semibold text-white/80">{credits}</span>
              </p>
              <p className="mt-1 text-xs text-white/55">
                Cost: <span className="font-semibold text-white/80">{cost}</span>{" "}
                <span className="inline-flex translate-y-[1px] text-[#79f89a]">
                  <Icon name="bolt" className="h-3.5 w-3.5" />
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/workspace/pricing")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Recharge
            </button>
          </div>

          <button
            type="button"
            onClick={onTransform}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7d7d9] px-4 py-3 text-sm font-semibold text-[#0b0d10] transition hover:bg-white disabled:opacity-60"
          >
            <span className="text-[#0b0d10]">
              <Icon name="wand" className="h-4 w-4" />
            </span>
            {loading ? "Optimizing..." : "Optimize Photos"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
          <div className="flex gap-2">
            <PillTab
              active={activeTab === "history"}
              label="History"
              iconName="clock"
              onClick={() => setActiveTab("history")}
            />
            <PillTab
              active={activeTab === "examples"}
              label="Examples"
              iconName="sparkles"
              onClick={() => setActiveTab("examples")}
            />
          </div>
        </div>

        <div className="h-[720px] overflow-auto bg-[radial-gradient(circle_at_40%_15%,rgba(255,255,255,0.06),rgba(0,0,0,0)_45%)]">
          <PreviewStage
            title={stageTitle}
            subtitle={stageSubtitle}
            imageUrl={stageImageUrl}
            imageAlt={stageImageAlt}
            downloadName={stageImageDownloadName}
          />

          {activeTab === "history" ? (
            <HistoryGallery
              history={historyData}
              loading={historyLoading}
              selectedId={selectedHistoryId}
              onSelect={(id) => setSelectedHistoryId(id)}
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            />
          ) : (
            <ExamplesGallery
              onUsePrompt={(p) => setPrompt(p)}
              examples={examples}
              source={examplesSource}
              selectedId={selectedExampleId}
              onSelect={(id) => setSelectedExampleId(id)}
            />
          )}
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-6 z-[80]">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-[#ff4b4b] px-4 py-3 text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <span className="text-lg font-bold">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message ? (
                <p className="mt-0.5 max-w-[360px] truncate text-xs text-white/90">
                  {toast.message}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
              aria-label="Close"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <CreationPickerModal
        open={showCreationPicker}
        loading={historyLoading}
        history={historyData}
        currentImages={uploadedImages}
        onClose={() => setShowCreationPicker(false)}
        onImport={(items) => {
          void importCreations(items);
        }}
      />
    </div>
  );
}
