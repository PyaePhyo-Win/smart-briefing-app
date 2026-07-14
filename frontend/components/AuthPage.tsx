"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, fetchCurrentUser, loginUser, registerUser } from "@/lib/api";

export type AuthMode = "login" | "register";

type AuthPageProps = {
  mode: AuthMode;
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const user = await fetchCurrentUser();
        if (!isMounted) return;

        if (user) {
          router.replace("/");
          return;
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router, t]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email.trim() || !password.trim()) return;

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const normalizedEmail = email.trim().toLowerCase();
        if (mode === "login") {
          await loginUser(normalizedEmail, password);
        } else {
          await registerUser(normalizedEmail, password);
        }

        setPassword("");
        router.replace("/");
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, mode, password, router, t]
  );

  const submitLabel = mode === "login" ? t("auth.login") : t("auth.register");
  const alternateHref = mode === "login" ? "/register" : "/login";
  const alternateLabel = mode === "login" ? t("auth.switchToRegister") : t("auth.switchToLogin");
  const title = mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle");
  const body = mode === "login" ? t("auth.loginBody") : t("auth.registerBody");

  return (
    <section className="w-full rounded-[1.75rem] border border-line bg-surface/95 p-5 shadow-soft backdrop-blur sm:rounded-[2rem] sm:p-7 lg:p-8">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1.5 text-xs font-medium text-rust">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("app.badge")}
        </div>
        <h2 className="font-serif text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
          {isInitializing ? t("auth.loading") : body}
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-paper px-4 py-3.5 text-sm leading-6 text-red-700 shadow-sm dark:border-red-900/60 dark:text-red-300 sm:px-5 sm:py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7">
        <div>
          <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold text-ink">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-line bg-paper py-3 pl-11 pr-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-rust focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              disabled={isInitializing || isSubmitting}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold text-ink">
            {t("auth.password")}
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-line bg-paper py-3 pl-11 pr-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-rust focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              disabled={isInitializing || isSubmitting}
              minLength={8}
              maxLength={1024}
              placeholder={t("auth.passwordPlaceholder")}
              required
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{t("auth.passwordHint")}</p>
        </div>
        <div className="space-y-4 pt-2">
          <button
            type="submit"
            disabled={isInitializing || isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rust px-6 py-3 text-sm font-semibold text-white transition hover:bg-rust/90 focus:outline-none focus:ring-4 focus:ring-rust/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{isSubmitting ? t("auth.submitting") : submitLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
          <p className="text-center text-sm text-muted">
            <Link
              href={alternateHref}
              className="font-semibold text-rust transition hover:text-rust/80 focus:outline-none focus:ring-4 focus:ring-rust/10"
            >
              {alternateLabel}
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}
