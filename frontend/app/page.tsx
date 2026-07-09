"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { ResearchForm } from "@/components/ResearchForm";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { status, logEntries, report, errorMessage, isRunning, submit, abort } =
    useResearchStream();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
        <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium tracking-wide text-muted shadow-soft">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-rust" aria-hidden="true" />
              AI Research Briefing
            </div>
            <h1 className="font-serif text-5xl font-medium leading-tight tracking-[-0.04em] text-ink sm:text-6xl">
              Smart Briefing
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              A focused research workspace for generating thoughtful, real-time intelligence briefings with CrewAI and Gemini.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <ResearchForm
          onSubmit={submit}
          onAbort={abort}
          status={status}
          isRunning={isRunning}
        />

        <StatusBar status={status} />

        {errorMessage && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-surface px-5 py-4 text-sm leading-6 text-red-700 shadow-soft dark:border-red-900/60 dark:text-red-300">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300"
              aria-hidden="true"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
          <AgentLogPanel entries={logEntries} isRunning={isRunning} />
          <ReportPanel report={report} status={status} isRunning={isRunning} />
        </div>

        <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
          Next.js · FastAPI · CrewAI · Gemini 2.5 Flash
        </footer>
      </div>
    </main>
  );
}
