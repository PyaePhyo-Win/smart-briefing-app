"use client";
import { useState, useCallback } from "react";
import { Check, ClipboardCopy, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import type { AppStatus } from "@/lib/types";

interface Props {
  report: string;
  status: AppStatus;
  isRunning: boolean;
}

export function ReportPanel({ report, status, isRunning }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [report]);

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="mb-3 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-rust">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rust">
              {t("report.assistant")}
            </p>
            <h2 className="font-serif text-xl text-ink">{t("report.title")}</h2>
          </div>
        </div>
        {report && status === "done" && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition duration-200 hover:border-rust hover:text-rust"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? t("report.copied") : t("report.copy")}
          </button>
        )}
      </div>

      <div className="rounded-[2rem] border border-line bg-surface p-4 shadow-soft sm:p-6">
        <div className="rounded-[1.5rem] border border-line bg-paper/45 p-5 sm:p-8">
          {!report && !isRunning && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-rust">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-2xl text-ink">{t("report.emptyTitle")}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                {t("report.emptyBody")}
              </p>
            </div>
          )}

          {isRunning && !report && (
            <div className="space-y-5" aria-label={t("report.generating")}>
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-3">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-line" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-line" />
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-line" />
                </div>
              ))}
            </div>
          )}

          {report && (
            <div className="prose prose-stone max-w-none text-ink prose-headings:font-serif prose-headings:text-ink prose-p:leading-8 prose-a:text-rust prose-strong:text-ink prose-code:rounded-md prose-code:bg-line prose-code:px-1.5 prose-code:py-0.5 prose-code:text-ink prose-pre:border prose-pre:border-line prose-pre:bg-ink prose-pre:text-paper dark:prose-invert dark:prose-code:bg-line/70">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
              {status === "polishing" && (
                <span className="ml-1 inline-block h-5 w-2 animate-pulse rounded-full bg-rust align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
