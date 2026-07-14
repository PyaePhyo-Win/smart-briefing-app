"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  compact?: boolean;
};

const STORAGE_KEY = "smart-briefing-theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.switchMode", {
        mode: isDark ? t("theme.light") : t("theme.dark"),
      })}
      aria-pressed={isDark}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-muted shadow-soft transition duration-200 hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10",
        compact && "h-10 px-3 sm:h-11 sm:px-3.5",
      )}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className={cn(compact && "sr-only sm:not-sr-only")}>
        {mounted && isDark ? t("theme.light") : t("theme.dark")}
      </span>
    </button>
  );
}
