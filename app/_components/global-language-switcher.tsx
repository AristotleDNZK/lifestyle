"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

type LanguageOption = {
  code: string;
  label: string;
};

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => unknown;
      };
    };
  }
}

const STORAGE_KEY = "global_lang";

const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "tr", label: "Türkçe" },
  { code: "pl", label: "Polski" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "fi", label: "Suomi" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "cs", label: "Čeština" },
  { code: "sk", label: "Slovenčina" },
  { code: "hu", label: "Magyar" },
  { code: "ro", label: "Română" },
  { code: "bg", label: "Български" },
  { code: "uk", label: "Українська" },
  { code: "el", label: "Ελληνικά" },
  { code: "he", label: "עברית" },
  { code: "fa", label: "فارسی" },
  { code: "ur", label: "اردو" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "sw", label: "Kiswahili" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "tl", label: "Filipino" },
  { code: "et", label: "Eesti" },
  { code: "lv", label: "Latviešu" },
  { code: "lt", label: "Lietuvių" },
  { code: "sl", label: "Slovenščina" },
  { code: "hr", label: "Hrvatski" },
  { code: "sr", label: "Српски" },
  { code: "mk", label: "Македонски" },
  { code: "sq", label: "Shqip" },
  { code: "is", label: "Íslenska" },
  { code: "ga", label: "Gaeilge" },
  { code: "mt", label: "Malti" },
  { code: "af", label: "Afrikaans" },
];

function setGoogTransCookie(lang: string) {
  const value = `/en/${lang}`;
  document.cookie = `googtrans=${value};path=/`;
  const host = window.location.hostname;
  document.cookie = `googtrans=${value};path=/;domain=${host}`;
}

function clearGoogTransCookie() {
  document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  document.cookie = `googtrans=;path=/;domain=${host};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function triggerGoogleTranslate(lang: string) {
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
  if (!select) return;
  if (select.value === lang) return;
  select.value = lang;
  select.dispatchEvent(new Event("change"));
}

export function GlobalLanguageSwitcher() {
  const includedLanguages = useMemo(
    () => LANGUAGES.map((l) => l.code).join(","),
    []
  );
  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [scriptReady, setScriptReady] = useState(false);
  const [shouldLoadTranslateScript, setShouldLoadTranslateScript] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, [includedLanguages, mounted]);

  useEffect(() => {
    if (!mounted || !scriptReady || !shouldLoadTranslateScript) return;
    if (lang === "en") return;
    const timer = setTimeout(() => {
      setGoogTransCookie(lang);
      triggerGoogleTranslate(lang);
    }, 120);
    return () => clearTimeout(timer);
  }, [lang, mounted, scriptReady, shouldLoadTranslateScript]);

  const applyLanguage = () => {
    localStorage.setItem(STORAGE_KEY, lang);
    if (lang === "en") {
      clearGoogTransCookie();
      setPanelOpen(false);
      return;
    }

    setShouldLoadTranslateScript(true);
    setGoogTransCookie(lang);
    if (scriptReady) {
      triggerGoogleTranslate(lang);
    }
    setPanelOpen(false);
  };

  return (
    <>
      {shouldLoadTranslateScript ? (
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
      ) : null}

      <div id="google_translate_element" className="hidden" />

      <div className="notranslate fixed right-4 top-4 z-[90]">
        <button
          onClick={() => setPanelOpen((s) => !s)}
          className="rounded-full border border-white/20 bg-[#0f1319]/95 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur transition hover:border-[#57f06d]/70"
        >
          Language
        </button>

        {panelOpen ? (
          <div className="mt-2 w-72 rounded-xl border border-white/15 bg-[#0f1319] p-4 text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
            <p className="text-sm font-semibold">Choose Language</p>
            <p className="mt-1 text-xs text-white/55">
              Supports 50+ languages. Selection applies globally.
            </p>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="mt-3 w-full rounded-lg border border-white/15 bg-[#101822] px-3 py-2 text-sm outline-none transition focus:border-[#57f06d]/70"
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            <div className="mt-3 flex gap-2">
              <button
                onClick={applyLanguage}
                className="flex-1 rounded-md bg-[#5ef36f] px-3 py-2 text-sm font-semibold text-[#0d1216] transition hover:bg-[#79ff89]"
              >
                Confirm
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

