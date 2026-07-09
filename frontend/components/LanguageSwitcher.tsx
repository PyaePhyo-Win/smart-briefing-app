"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("my") ? "my" : "en";

  return (
    <div className="inline-flex items-center">
      <Select
        value={language}
        onValueChange={(value) => {
          void i18n.changeLanguage(value);
        }}
      >
        <SelectTrigger aria-label={t("language.label")} className="w-[9.5rem]">
          <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="en">{t("language.english")}</SelectItem>
          <SelectItem value="my">{t("language.myanmar")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}