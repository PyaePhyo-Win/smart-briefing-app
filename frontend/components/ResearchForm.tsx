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
    <form onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-line bg-surface p-2 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label htmlFor="research-topic" className="sr-only">
            Research topic
          </label>
          <textarea
            id="research-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ask for a briefing..."
            disabled={isRunning}
            maxLength={300}
            rows={1}
            className="max-h-36 min-h-14 flex-1 resize-none rounded-2xl border border-transparent bg-surface px-4 py-4 text-sm leading-6 text-ink placeholder:text-muted/70 outline-none transition duration-200 focus:border-rust focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {isRunning ? (
            <button
              type="button"
              onClick={onAbort}
              className="min-h-14 rounded-2xl border border-line-strong bg-surface px-6 py-4 text-sm font-semibold text-ink transition duration-200 hover:border-rust hover:text-rust disabled:opacity-60"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!topic.trim()}
              className="min-h-14 rounded-2xl bg-rust px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-rust/90 focus:outline-none focus:ring-4 focus:ring-rust/20 disabled:cursor-not-allowed disabled:opacity-40"
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
