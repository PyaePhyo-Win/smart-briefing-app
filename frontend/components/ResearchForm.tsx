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
      <div className="flex gap-3">
        <input
          id="research-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic to research (e.g. 'Quantum computing in 2025')..."
          disabled={isRunning}
          maxLength={300}
          className="flex-1 px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 text-sm"
        />
        {isRunning ? (
          <button
            type="button"
            onClick={onAbort}
            className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all duration-200 whitespace-nowrap text-sm"
          >
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            disabled={!topic.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 whitespace-nowrap text-sm shadow-lg shadow-violet-900/30"
          >
            {buttonLabel}
          </button>
        )}
      </div>
      {topic.length > 250 && (
        <p className="text-xs text-amber-400 mt-1.5 ml-1">
          {300 - topic.length} characters remaining
        </p>
      )}
    </form>
  );
}
