"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Sparkles } from "lucide-react";
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

  return (
    <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-soft sm:p-7">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1.5 text-xs font-medium text-rust">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("app.badge")}
        </div>
        <h2 className="font-serif text-3xl font-medium tracking-[-0.04em] text-ink">
          {t("auth.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {isInitializing ? t("auth.loading") : t("auth.body")}
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-paper px-5 py-4 text-sm leading-6 text-red-700 shadow-sm dark:border-red-900/60 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold text-ink">
            {t("auth.email")}
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-rust focus:ring-4 focus:ring-rust/10"
            disabled={isInitializing || isSubmitting}
            required
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold text-ink">
            {t("auth.password")}
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-rust focus:ring-4 focus:ring-rust/10"
            disabled={isInitializing || isSubmitting}
            minLength={8}
            maxLength={1024}
            required
          />
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isInitializing || isSubmitting}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-rust px-6 py-3 text-sm font-semibold text-white transition hover:bg-rust/90 focus:outline-none focus:ring-4 focus:ring-rust/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
          <Link
            href={alternateHref}
            className="text-center text-sm font-semibold text-muted transition hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 sm:text-left"
          >
            {alternateLabel}
          </Link>
        </div>
      </form>
    </section>
  );
}
