import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UiLanguage = "uz" | "ru";

const UI_LANGUAGE_STORAGE_KEY = "ui-language";

type UiLanguageContextValue = {
  lang: UiLanguage;
  setLang: (lang: UiLanguage) => void;
  t: (uz: string, ru: string) => string;
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

function detectInitialLanguage(): UiLanguage {
  if (typeof window === "undefined") return "uz";
  try {
    const saved = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (saved === "uz" || saved === "ru") return saved;
  } catch {
    void 0;
  }
  const browserLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  return browserLang.startsWith("ru") ? "ru" : "uz";
}

export function translateByLanguage(lang: UiLanguage, uz: string, ru: string): string {
  return lang === "ru" ? ru : uz;
}

export function UiLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<UiLanguage>(() => detectInitialLanguage());

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, lang);
    } catch {
      void 0;
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "ru" ? "ru" : "uz";
    }
  }, [lang]);

  const value = useMemo<UiLanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (uz, ru) => translateByLanguage(lang, uz, ru),
    }),
    [lang]
  );

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage(): UiLanguageContextValue {
  const ctx = useContext(UiLanguageContext);
  if (!ctx) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider");
  }
  return ctx;
}
