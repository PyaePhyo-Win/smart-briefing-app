"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden border-r border-line bg-[radial-gradient(circle_at_20%_20%,rgba(191,87,0,0.20),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(191,87,0,0.08))] px-10 py-8 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.22),transparent_30%),linear-gradient(135deg,rgba(30,25,22,0.96),rgba(191,87,0,0.12))] lg:flex lg:flex-col lg:gap-8 xl:px-16">
          <div className="absolute inset-x-12 bottom-20 top-24 rounded-[3rem] border border-white/40 bg-white/20 blur-3xl dark:border-white/10 dark:bg-white/5" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rust text-white shadow-soft">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rust">{t("app.badge")}</p>
              <h1 className="text-2xl font-semibold text-ink">{t("app.title")}</h1>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 overflow-hidden rounded-[2.25rem] border border-white/50 bg-surface/80 p-5 shadow-soft backdrop-blur-xl dark:border-white/10">
            <div className="relative min-h-[32rem] flex-1 overflow-hidden rounded-[1.75rem] border border-white/40 bg-paper/85 dark:border-white/10">
              <Image
                src="/images/auth-image.png"
                alt="Smart briefing workspace preview"
                fill
                priority
                sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col bg-paper px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rust text-white shadow-soft">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">{t("app.badge")}</p>
                <p className="font-semibold text-ink">{t("app.title")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
