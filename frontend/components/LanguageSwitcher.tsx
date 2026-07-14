"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageSwitcherProps = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
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
        <SelectTrigger
          aria-label={t("language.label")}
          className={cn("w-[9.5rem]", compact && "h-10 w-[5.75rem] px-3 sm:h-11 sm:w-[9.5rem] sm:px-3.5")}
        >
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