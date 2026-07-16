"use client";

import { SettingsShell, StaticSettingsSection } from "@/components/SettingsShell";
import { useTranslation } from "react-i18next";

export default function BillingSettingsPage() {
  const { t } = useTranslation();
  return <SettingsShell title={t("settings.billingTitle")} backHref="/settings" backLabel={t("settings.backToSettings")}><StaticSettingsSection title={t("settings.billingTitle")} description={t("settings.billingDescription")} status={t("settings.comingSoon")} /></SettingsShell>;
}
