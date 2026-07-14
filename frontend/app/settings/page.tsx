"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Settings, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  const isInitializing = isLoading || !user;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex h-16 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
            aria-label={t("settings.backToWorkspace")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
            <Settings className="h-4 w-4 text-rust" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {t("app.title")}
            </p>
            <h1 className="truncate font-serif text-xl font-medium tracking-[-0.03em] text-ink">
              {t("settings.title")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-soft sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1.5 text-xs font-medium text-rust">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("settings.accountBadge")}
          </div>
          <h2 className="mt-5 font-serif text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
            {t("settings.accountTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {t("settings.accountDescription")}
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-7">
          {isInitializing ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("settings.loading")}
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("settings.email")}
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold text-ink">
                  {user.email}
                </dd>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("settings.userId")}
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold text-ink">
                  {user.id}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>
    </main>
  );
}
