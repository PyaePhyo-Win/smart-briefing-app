"use client";

import { SettingsShell } from "@/components/SettingsShell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

export default function PreferencesSettingsPage() {
  const { t } = useTranslation();
  return (
    <SettingsShell title={t("settings.preferencesTitle")} backHref="/settings" backLabel={t("settings.backToSettings")}>
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <h2 className="font-serif text-2xl font-medium tracking-[-0.03em] text-ink">{t("settings.preferencesTitle")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{t("settings.preferencesDescription")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-paper p-4"><div><p className="text-sm font-semibold text-ink">{t("settings.languagePreference")}</p><p className="mt-1 text-xs text-muted">{t("settings.languagePreferenceDescription")}</p></div><LanguageSwitcher compact /></div>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-paper p-4"><div><p className="text-sm font-semibold text-ink">{t("settings.themePreference")}</p><p className="mt-1 text-xs text-muted">{t("settings.themePreferenceDescription")}</p></div><ThemeToggle compact /></div>
        </div>
      </div>
    </SettingsShell>
  );
}
