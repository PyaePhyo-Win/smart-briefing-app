"use client";
import { useState, FormEvent } from "react";
import type { AppStatus } from "@/lib/types";

interface Props {
  onSubmit: (topic: string) => void;
  onAbort: () => void;
  status: AppStatus;
  isRunning: boolean;
}

export function ResearchForm({ onSubmit, onAbort, status, isRunning }: Props) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(topic);
  };

  const buttonLabel =
    status === "connecting"
      ? "Connecting..."
      : status === "researching"
        ? "Researching..."
        : status === "polishing"
          ? "Polishing..."
          : "Research";

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="rounded-3xl border border-line bg-surface p-2.5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="research-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to research, e.g. Quantum computing in 2025"
            disabled={isRunning}
            maxLength={300}
            className="min-h-14 flex-1 rounded-2xl border border-transparent bg-surface px-5 py-4 text-sm text-ink placeholder:text-muted/70 outline-none transition duration-200 focus:border-rust focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {isRunning ? (
            <button
              type="button"
              onClick={onAbort}
              className="min-h-14 rounded-2xl border border-line-strong bg-surface px-7 py-4 text-sm font-semibold text-ink transition duration-200 hover:border-rust hover:text-rust disabled:opacity-60"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!topic.trim()}
              className="min-h-14 rounded-2xl bg-rust px-8 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-rust/90 focus:outline-none focus:ring-4 focus:ring-rust/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
      {topic.length > 250 && (
        <p className="ml-3 mt-2 text-xs text-rust">
          {300 - topic.length} characters remaining
        </p>
      )}
    </form>
  );
}
