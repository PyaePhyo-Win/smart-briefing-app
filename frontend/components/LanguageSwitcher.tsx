"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("my") ? "my" : "en";

  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-muted shadow-soft transition duration-200 hover:border-rust focus-within:border-rust focus-within:text-rust">
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={language}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
        aria-label={t("language.label")}
        className="bg-transparent pr-6 text-sm font-medium text-current outline-none"
      >
        <option value="en">{t("language.english")}</option>
        <option value="my">{t("language.myanmar")}</option>
      </select>
    </label>
  );
}