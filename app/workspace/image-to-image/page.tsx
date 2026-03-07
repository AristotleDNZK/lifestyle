"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
    label: "Auto Balanced (⚡️ 3)",
    cost: 3,
    note: "Balanced mode for most scenarios.",
  },
  {
    id: "standard",
    label: "Standard / Fast (⚡️ 2)",
    cost: 2,
    note: "Lower cost and faster generation.",
  },
  {
    id: "pro",
    label: "Pro / High Quality (⚡️ 4)",
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
}: {
  images: StoredImage[];
  setImages: (next: StoredImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 5 - images.length);
    const readOne = (file: File) =>
      new Promise<StoredImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            id: uid("img"),
            name: file.name,
            dataUrl: String(reader.result || ""),
          });
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
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
    <div className="rounded-2xl border border-white/10 bg-[#090c12] p-4 sm:p-5">
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
        className={`mt-3 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 text-center outline-none transition ${
          dragOver ? "border-[#57f06d]/70 bg-[#0b1310]" : "hover:bg-black/30"
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
          Optional. Multi-select, drag and drop, or paste
        </p>
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-white/85 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            // Placeholder: hook into /workspace/my-creations selection later.
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
          ? "border-[#57f06d]/60 bg-[#183123]"
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
  modelId,
  setModelId,
  ratio,
  setRatio,
  multiShot,
  setMultiShot,
}: {
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
    <div className="rounded-2xl border border-white/10 bg-[#090c12] p-4 sm:p-5">
      <p className="text-sm font-semibold text-white/80">Settings</p>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.1em] text-white/40">
          Model
        </p>
        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full appearance-none rounded-md bg-[#080b10] text-sm text-white outline-none [color-scheme:dark] focus:ring-0"
          >
            {MODELS.map((m) => (
              <option
                key={m.id}
                value={m.id}
                className="bg-[#080b10] text-white"
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
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[#57f06d]" />
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
          Transform an image to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {history.map((item) => (
          <article
            key={item.id}
            className={`group overflow-hidden rounded-xl border bg-black/20 transition ${
              selectedId === item.id
                ? "border-[#57f06d]/55 shadow-[0_14px_40px_rgba(87,240,109,0.12)]"
                : "border-white/10 hover:border-white/20"
            }`}
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
                alt="result"
                className="h-40 w-full object-cover"
              />
            </button>
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
        ))}
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
                  ? "border-[#57f06d]/55 shadow-[0_14px_40px_rgba(87,240,109,0.12)]"
                  : "border-white/10 hover:border-[#57f06d]/50 hover:shadow-[0_14px_40px_rgba(87,240,109,0.10)]"
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
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
}) {
  return (
    <div className="px-5 pt-5">
      <div className="sr-only">
        {title} {subtitle}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <div className="relative h-[520px] w-full bg-[radial-gradient(circle_at_35%_15%,rgba(255,255,255,0.06),rgba(0,0,0,0)_55%)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="preview"
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

  const [credits, setCredits] = useState<number>(0);
  const [selectedExampleId, setSelectedExampleId] = useSessionStorageState<
    string | null
  >("i2i_selectedExampleId", null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  const fetchHistory = async (page: number) => {
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
          const url = String(item?.url || "");
          return url.length > 0 && !url.startsWith("data:image/");
        })
        .map((item) => ({
          id: String(item.id),
          imageUrl: String(item.url),
          prompt: String(item.prompt || ""),
          modelId: String(item.model_id || item.model_name || item.model || ""),
          ratio: String(item.aspect_ratio || "auto"),
          createdAt: formatDateLabel(item.created_at),
        }));

      setHistoryData(normalized);
      setTotalPages(Math.max(1, Number(data?.totalPages || 1)));
      setSelectedHistoryId((prev) =>
        prev && normalized.some((x) => x.id === prev)
          ? prev
          : normalized[0]?.id || null
      );
    } catch (e: any) {
      showError(e?.message || "Failed to load history.");
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

  const onTransform = async () => {
    if (loading) return;
    const first = uploadedImages[0];
    if (!first?.dataUrl) {
      showError("Please upload an image first.");
      return;
    }
    const parsed = parseDataUrl(first.dataUrl);
    if (!parsed?.base64) {
      showError("Invalid image format. Please re-upload the image.");
      return;
    }
    const promptText = (prompt || "").trim();
    if (!promptText) {
      showError("Prompt is required.");
      return;
    }

    // Use real credits from DB. Form state is already persisted via sessionStorage hooks.
    if (credits < cost) {
      router.push("/workspace/pricing");
      return;
    }

    setLoading(true);
    try {
      setActiveTab("history");

      const controller = new AbortController();
      // Keep client timeout >= server-side Gemini timeout, otherwise the server may succeed
      // but the client aborts first (you'll see server 200 but UI still errors).
      const timeout = setTimeout(() => controller.abort(), 190_000);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptText,
          ratio,
          model: selectedModel,
          imageMimeType: parsed.mimeType,
          imageBase64: parsed.base64,
        }),
      }).finally(() => clearTimeout(timeout));

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
      if (!data?.success) {
        showError(data?.error || "Generation completed but no cloud result returned.");
        return;
      }
      setCurrentPage(1);
      await fetchHistory(1);
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

  return (
    <div className="relative grid gap-5 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <UploadZone images={uploadedImages} setImages={setUploadedImages} />

        <div className="rounded-2xl border border-white/10 bg-[#090c12] p-4 sm:p-5">
          <p className="text-sm font-semibold text-white/80">Prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe how you want to edit the image, e.g. change the background to a sunset scene, add more contrast..."
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-[#57f06d]/60"
          />
        </div>

        <SettingsPanel
          modelId={MODELS.some((m) => m.id === selectedModel) ? selectedModel : MODELS[0].id}
          setModelId={setSelectedModel}
          ratio={ratio}
          setRatio={setRatio}
          multiShot={multiShot}
          setMultiShot={setMultiShot}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#090c12] px-5 py-4">
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
            {loading ? "Transforming..." : "Transform Image"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090c12]">
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
    </div>
  );
}

