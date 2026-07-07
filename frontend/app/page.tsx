"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { ResearchForm } from "@/components/ResearchForm";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { ReportPanel } from "@/components/ReportPanel";

export default function Home() {
  const { status, logEntries, report, errorMessage, isRunning, submit, abort } =
    useResearchStream();

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-sm shadow-lg shadow-violet-900/40">
              <Sparkles className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Smart Briefing
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-11">
            AI research agent powered by CrewAI &amp; Gemini — real-time streaming
          </p>
        </header>

        {/* Search Form */}
        <ResearchForm
          onSubmit={submit}
          onAbort={abort}
          status={status}
          isRunning={isRunning}
        />

        {/* Status Bar */}
        <StatusBar status={status} />

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-start gap-2.5">
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5 text-red-400"
              aria-hidden="true"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Two-panel layout */}
        <div className="grid grid-cols-2 gap-6">
          <AgentLogPanel entries={logEntries} isRunning={isRunning} />
          <ReportPanel report={report} status={status} isRunning={isRunning} />
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-700 text-xs mt-10">
          Next.js · FastAPI · CrewAI · Gemini 2.5 Flash
        </footer>

      </div>
    </main>
  );
}
