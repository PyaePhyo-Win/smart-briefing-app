"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { SettingsShell } from "@/components/SettingsShell";
import { useAuth } from "@/components/AuthProvider";
import {
  cancelBillingSubscription,
  createBillingCheckoutSession,
  fetchBillingStatus,
  resumeBillingSubscription,
} from "@/lib/api";
import { formatLocalDateTime } from "@/lib/dateTime";
import type { BillingStatus, UsageWindow } from "@/lib/types";
import { useTranslation } from "react-i18next";

function getStatusLabelKey(status: string, canceling: boolean) {
  if (canceling) {
    return "settings.subscriptionCanceling";
  }

  switch (status) {
    case "active":
      return "settings.subscriptionActive";
    case "trialing":
      return "settings.subscriptionTrialing";
    case "past_due":
      return "settings.subscriptionPastDue";
    case "canceled":
      return "settings.subscriptionCanceled";
    default:
      return "settings.subscriptionInactive";
  }
}

function getWindowTitle(window: UsageWindow) {
  if (window.kind === "chat") {
    return "Chat messages";
  }

  if (window.kind === "research") {
    return "Research runs";
  }

  return "Shared units";
}

export default function BillingSettingsPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <SettingsShell
          title={t("settings.billingTitle")}
          description={t("settings.billingDescription")}
          backHref="/settings"
          backLabel={t("settings.backToSettings")}
        >
          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3 text-sm font-semibold text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-rust" aria-hidden="true" />
              {t("settings.billingLoading")}
            </div>
          </section>
        </SettingsShell>
      }
    >
      <BillingSettingsContent />
    </Suspense>
  );
}

function BillingSettingsContent() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"checkout" | "cancel" | "resume" | null>(null);

  const checkoutState = searchParams.get("checkout");

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextBilling = await fetchBillingStatus();
      setBilling(nextBilling);
      await refreshUser();
    } catch {
      setError(t("settings.billingLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, t]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const planLabel = billing?.is_pro ? t("settings.planPro") : t("settings.planFree");
  const cancelingAtPeriodEnd = billing?.cancel_at_period_end ?? false;
  const statusLabel = billing
    ? t(getStatusLabelKey(billing.subscription_status, cancelingAtPeriodEnd))
    : t("settings.unavailable");
  const summary = billing?.is_pro ? t("settings.proPlanSummary") : t("settings.freePlanSummary");
  const hasSubscription = Boolean(billing?.stripe_subscription_id);

  const usageWindows = useMemo(() => billing?.usage.windows ?? [], [billing]);

  const runAction = async (nextAction: "checkout" | "cancel" | "resume") => {
    setAction(nextAction);
    setError(null);
    try {
      if (nextAction === "checkout") {
        const checkout = await createBillingCheckoutSession();
        window.location.href = checkout.url;
        return;
      }

      if (nextAction === "cancel") {
        await cancelBillingSubscription();
      } else {
        await resumeBillingSubscription();
      }

      await loadBilling();
    } catch {
      setError(t("settings.billingError"));
    } finally {
      setAction(null);
    }
  };

  return (
    <SettingsShell
      title={t("settings.billingTitle")}
      description={t("settings.billingDescription")}
      backHref="/settings"
      backLabel={t("settings.backToSettings")}
    >
      <div className="space-y-5">
        {checkoutState === "success" ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <p>{t("settings.billingCheckoutSuccess")}</p>
          </div>
        ) : null}

        {checkoutState === "cancelled" ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <p>{t("settings.billingCheckoutCanceled")}</p>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rust/20 bg-rust/5 text-rust">
                <CreditCard className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rust">
                  {t("settings.currentPlan")}
                </p>
                <h2 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-ink">{planLabel}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{summary}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadBilling()}
                disabled={isLoading || Boolean(action)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                {t("settings.refresh")}
              </button>

              {!billing?.is_pro ? (
                <button
                  type="button"
                  onClick={() => void runAction("checkout")}
                  disabled={isLoading || Boolean(action)}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-ink px-5 py-2 text-sm font-semibold text-paper shadow-soft transition hover:-translate-y-0.5 hover:bg-rust focus:outline-none focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === "checkout" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action === "checkout" ? t("settings.openingCheckout") : t("settings.upgradeToPro")}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : cancelingAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={() => void runAction("resume")}
                  disabled={isLoading || Boolean(action)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  {action === "resume" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action === "resume" ? t("settings.updatingSubscription") : t("settings.resumeSubscription")}
                </button>
              ) : hasSubscription ? (
                <button
                  type="button"
                  onClick={() => void runAction("cancel")}
                  disabled={isLoading || Boolean(action)}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2 text-sm font-semibold text-muted transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-red-900/60 dark:hover:text-red-300"
                >
                  {action === "cancel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <PauseCircle className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action === "cancel" ? t("settings.updatingSubscription") : t("settings.cancelSubscription")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {t("settings.subscriptionStatus")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{statusLabel}</p>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {t("settings.renewsAt")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {billing?.subscription_current_period_end
                  ? formatLocalDateTime(billing.subscription_current_period_end)
                  : t("settings.unavailable")}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {t("settings.stripeConnected")}
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-ink">
                {billing?.stripe_customer_id ?? t("settings.noSubscription")}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rust">
                {t("settings.quotaUsage")}
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-ink">{t("settings.billingCardDescription")}</h2>
            </div>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-rust" aria-hidden="true" /> : null}
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-muted">{t("settings.billingLoading")}</p>
          ) : usageWindows.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {usageWindows.map((window) => {
                const ratio = window.limit > 0 ? Math.min(100, Math.round((window.used / window.limit) * 100)) : 0;

                return (
                  <article key={`${window.name}-${window.kind}`} className="rounded-2xl border border-line bg-paper p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{getWindowTitle(window)}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {t("settings.windowResets", { time: formatLocalDateTime(window.window_end) })}
                        </p>
                      </div>
                      <span className="rounded-full border border-rust/20 bg-rust/5 px-3 py-1 text-xs font-semibold text-rust">
                        {t("settings.quotaRemaining", { count: window.remaining })}
                      </span>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-rust" style={{ width: `${ratio}%` }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-muted">
                      {t("settings.quotaUsed", { used: window.used, limit: window.limit })}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{t("settings.unavailable")}</p>
          )}
        </section>
      </div>
    </SettingsShell>
  );
}
