"use client";

import { SettingsShell, StaticSettingsSection } from "@/components/SettingsShell";
import { useTranslation } from "react-i18next";

export default function UsageSettingsPage() {
  const { t } = useTranslation();
  return <SettingsShell title={t("settings.usageTitle")} backHref="/settings" backLabel={t("settings.backToSettings")}><StaticSettingsSection title={t("settings.usageTitle")} description={t("settings.usageDescription")} status={t("settings.comingSoon")} /></SettingsShell>;
}
