"use client";

import {
  CreditCard,
  Gauge,
  Languages,
  ReceiptText,
  UserCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsCard, SettingsShell } from "@/components/SettingsShell";

export default function SettingsPage() {
  const { t } = useTranslation();

  const cards = [
    { href: "/settings/profile", icon: UserCircle, title: t("settings.profileTitle"), description: t("settings.profileCardDescription") },
    { href: "/settings/usage", icon: Gauge, title: t("settings.usageTitle"), description: t("settings.usageCardDescription") },
    { href: "/settings/credits", icon: CreditCard, title: t("settings.creditsTitle"), description: t("settings.creditsCardDescription") },
    { href: "/settings/billing", icon: ReceiptText, title: t("settings.billingTitle"), description: t("settings.billingCardDescription") },
    { href: "/settings/preferences", icon: Languages, title: t("settings.preferencesTitle"), description: t("settings.preferencesCardDescription") },
  ];

  return (
    <SettingsShell
      title={t("settings.title")}
      eyebrow={t("settings.accountBadge")}
      description={t("settings.accountDescription")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => <SettingsCard key={card.href} {...card} />)}
      </div>
    </SettingsShell>
  );
}
