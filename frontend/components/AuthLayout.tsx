"use client";

import Image from "next/image";
import {
  BookOpenText,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthSuccessTransition } from "@/components/AuthSuccessTransitionProvider";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const { isPlaying, mode } = useAuthSuccessTransition();
  const successTitleKey =
    mode === "register" ? "auth.registerSuccessTitle" : "auth.loginSuccessTitle";
  const successDescriptionKey =
    mode === "register"
      ? "auth.registerSuccessDescription"
      : "auth.loginSuccessDescription";

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div
        className={isPlaying ? "auth-success-layout-exit grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]" : "grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]"}
      >
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

          <div className="relative z-10 grid gap-3 text-sm text-muted xl:grid-cols-3">
            <div className="rounded-2xl border border-white/50 bg-surface/70 p-4 backdrop-blur dark:border-white/10">
              <BookOpenText className="mb-3 h-5 w-5 text-rust" aria-hidden="true" />
              <p className="font-semibold text-ink">{t("auth.featureResearch")}</p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-surface/70 p-4 backdrop-blur dark:border-white/10">
              <MessageSquareText className="mb-3 h-5 w-5 text-rust" aria-hidden="true" />
              <p className="font-semibold text-ink">{t("auth.featureChat")}</p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-surface/70 p-4 backdrop-blur dark:border-white/10">
              <ShieldCheck className="mb-3 h-5 w-5 text-rust" aria-hidden="true" />
              <p className="font-semibold text-ink">{t("auth.featureSecure")}</p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(193,95,60,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.52),transparent_28%)] px-4 py-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(212,120,84,0.17),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_28%)] sm:px-6 sm:py-5 lg:bg-paper lg:px-10 lg:py-5 lg:dark:bg-paper">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rust text-white shadow-soft sm:h-11 sm:w-11">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rust sm:text-xs sm:tracking-[0.2em]">{t("app.badge")}</p>
                <p className="truncate font-semibold text-ink">{t("app.title")}</p>
              </div>
            </div>

          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-7 sm:py-10 lg:max-w-md lg:py-10">
            <div className="mb-5 rounded-[1.5rem] border border-line bg-surface/80 p-4 shadow-soft backdrop-blur lg:hidden">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rust/10 text-rust">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-medium tracking-[-0.04em] text-ink">{t("app.heroTitle")}</h1>
                  <p className="mt-2 text-sm leading-6 text-muted">{t("app.heroDescription")}</p>
                </div>
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>

      {isPlaying ? (
        <div className="auth-success-overlay pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-5">
          <div className="auth-success-card w-full max-w-lg rounded-[2rem] border border-line bg-surface/90 p-8 text-center shadow-soft backdrop-blur-xl sm:p-10">
            <div className="auth-success-icon mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rust text-white shadow-soft">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="auth-success-kicker mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-rust">
              {t("app.badge")}
            </p>
            <h2 className="auth-success-title mt-3 font-serif text-4xl font-medium tracking-[-0.05em] text-ink sm:text-5xl">
              {t(successTitleKey)}
            </h2>
            <p className="auth-success-description mx-auto mt-4 max-w-sm text-sm leading-6 text-muted sm:text-base">
              {t(successDescriptionKey)}
            </p>
            <p className="auth-success-app-title mt-6 text-sm font-semibold text-ink">{t("app.title")}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
