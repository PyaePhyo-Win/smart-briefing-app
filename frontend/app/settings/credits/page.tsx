"use client";

import { SettingsShell, StaticSettingsSection } from "@/components/SettingsShell";
import { useTranslation } from "react-i18next";

export default function CreditsSettingsPage() {
  const { t } = useTranslation();
  return <SettingsShell title={t("settings.creditsTitle")} backHref="/settings" backLabel={t("settings.backToSettings")}><StaticSettingsSection title={t("settings.creditsTitle")} description={t("settings.creditsDescription")} status={t("settings.comingSoon")} /></SettingsShell>;
}
