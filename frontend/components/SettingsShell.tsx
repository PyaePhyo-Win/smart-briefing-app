"use client";

import { ArrowLeft, Settings, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";

type SettingsShellProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function SettingsShell({
  children,
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel,
}: SettingsShellProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex h-16 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
            aria-label={backLabel ?? t("settings.backToWorkspace")}
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
              {title}
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        {eyebrow || description ? (
          <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-soft sm:p-7">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </section>
    </main>
  );
}

type SettingsCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export function SettingsCard({ href, icon: Icon, title, description }: SettingsCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="group flex min-h-44 flex-col items-start justify-between rounded-3xl border border-line bg-surface p-5 text-left shadow-soft transition hover:-translate-y-1 hover:border-rust/50 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-rust/10"
      aria-label={t("settings.openSection", { section: title })}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rust/20 bg-rust/5 text-rust transition group-hover:bg-rust group-hover:text-paper">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-6">
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mt-2 block text-sm leading-5 text-muted">{description}</span>
      </span>
    </button>
  );
}

type StaticSettingsSectionProps = {
  title: string;
  description: string;
  status: string;
  children?: React.ReactNode;
};

export function StaticSettingsSection({
  title,
  description,
  status,
  children,
}: StaticSettingsSectionProps) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rust/20 bg-rust/5 text-rust">
        <Settings className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-6 font-serif text-2xl font-medium tracking-[-0.03em] text-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-paper px-4 py-4 text-sm text-muted">
        {status}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
