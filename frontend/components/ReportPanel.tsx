"use client";
import { useState, useCallback } from "react";
import { Check, ClipboardCopy, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AppStatus } from "@/lib/types";

interface Props {
  report: string;
  status: AppStatus;
  isRunning: boolean;
}

export function ReportPanel({ report, status, isRunning }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [report]);

  return (
    <section className="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <h2 className="font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Live Report
        </h2>
        {report && status === "done" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition duration-200 hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="h-[580px] overflow-y-auto rounded-2xl border border-line bg-paper/45 p-7">
        {!report && !isRunning && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full border border-line bg-paper p-4">
              <FileText
                className="h-9 w-9 shrink-0 text-muted/60"
                aria-hidden="true"
              />
            </div>
            <p className="max-w-xs text-sm leading-6 text-muted">
              Report will appear here after research completes.
            </p>
          </div>
        )}
        {!report && isRunning && (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-3/4 rounded bg-line" />
            <div className="h-4 w-full rounded bg-line" />
            <div className="h-4 w-5/6 rounded bg-line" />
            <div className="h-4 w-full rounded bg-line" />
            <div className="mt-8 h-6 w-1/2 rounded bg-line" />
            <div className="h-4 w-full rounded bg-line" />
            <div className="h-4 w-4/5 rounded bg-line" />
          </div>
        )}
        {report && (
          <div className="prose prose-stone max-w-none prose-sm leading-7 text-ink prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-[-0.02em] prose-headings:text-ink prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-ink prose-strong:text-ink prose-a:text-rust prose-a:no-underline hover:prose-a:underline prose-hr:border-line prose-blockquote:border-rust prose-blockquote:bg-surface prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-muted dark:prose-invert dark:prose-headings:text-ink dark:prose-p:text-ink dark:prose-strong:text-ink dark:prose-blockquote:text-muted">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            {status === "polishing" && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-rust align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
