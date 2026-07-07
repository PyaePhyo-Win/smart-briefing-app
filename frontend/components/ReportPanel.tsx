"use client";
import { useState, useCallback } from "react";
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
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Live Report
        </h2>
        {report && status === "done" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <span>⎘</span>
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/80 h-[580px] overflow-y-auto p-6">
        {!report && !isRunning && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <div className="text-4xl opacity-20">📄</div>
            <p className="text-gray-600 text-sm">
              Report will appear here after research completes
            </p>
          </div>
        )}
        {!report && isRunning && (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-gray-700/50 rounded w-3/4" />
            <div className="h-4 bg-gray-700/50 rounded w-full" />
            <div className="h-4 bg-gray-700/50 rounded w-5/6" />
            <div className="h-4 bg-gray-700/50 rounded w-full" />
            <div className="mt-6 h-5 bg-gray-700/50 rounded w-1/2" />
            <div className="h-4 bg-gray-700/50 rounded w-full" />
            <div className="h-4 bg-gray-700/50 rounded w-4/5" />
          </div>
        )}
        {report && (
          <div className="prose prose-invert prose-sm max-w-none text-gray-200 prose-headings:text-white prose-h1:text-xl prose-h2:text-lg prose-strong:text-white prose-a:text-violet-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            {status === "polishing" && (
              <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
