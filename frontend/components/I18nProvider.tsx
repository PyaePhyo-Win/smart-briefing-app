"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyLang = (language: string) => {
      document.documentElement.lang = language.startsWith("my") ? "my" : "en";
    };

    applyLang(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", applyLang);

    return () => {
      i18n.off("languageChanged", applyLang);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}