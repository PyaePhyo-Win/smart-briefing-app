"use client";
import { useRef, useEffect } from "react";
import type { LogEntry } from "@/lib/types";

interface Props {
  entries: LogEntry[];
  isRunning: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  tool_started: "text-rust",
  tool_finished: "text-emerald-700 dark:text-emerald-400",
  reasoning_started: "text-ink",
  reasoning_completed: "text-muted",
  task_started: "text-rust",
  task_completed: "text-emerald-700 dark:text-emerald-400",
  execution_started: "text-rust",
  execution_completed: "text-emerald-700 dark:text-emerald-400",
  status: "text-muted",
};

const padTimePart = (value: number) => value.toString().padStart(2, "0");

const formatLocalTime = (timestamp: string) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "--";

  const hours = date.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const time = [displayHour, date.getMinutes(), date.getSeconds()]
    .map(padTimePart)
    .join(":");

  return `${time} ${period}`;
};

export function AgentLogPanel({ entries, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <section className="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-rust" />
        </div>
        <h2 className="font-serif text-xl font-medium tracking-[-0.02em] text-ink">
          Agent Workspace
        </h2>
        {isRunning && (
          <span className="ml-auto flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1 text-xs font-medium text-rust">
            <span className="h-1.5 w-1.5 rounded-full bg-rust animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="h-[580px] overflow-y-auto rounded-2xl border border-line bg-paper/45 p-5 font-mono text-xs leading-6">
        {entries.length === 0 && !isRunning && (
          <p className="select-none text-muted/75 italic">
            Submit a topic to begin...
          </p>
        )}
        {entries.length === 0 && isRunning && (
          <p className="animate-pulse text-muted/75">
            Waiting for agent events...
          </p>
        )}
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="group border-b border-line/70 pb-2 last:border-b-0">
              <time
                className="text-muted/70 select-none"
                dateTime={entry.timestamp}
              >
                {formatLocalTime(entry.timestamp)}
              </time>
              <span className="mx-2 align-middle text-line-strong" aria-hidden="true">/</span>
              <span
                className={`mr-2 font-semibold ${
                  entry.agent === "System" ? "text-rust" : "text-muted"
                }`}
              >
                {entry.agent}
              </span>
              <span className={EVENT_COLORS[entry.event] ?? "text-ink"}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 pt-3" aria-hidden="true">
            <span className="h-px w-6 bg-line" />
            <span className="inline-block h-4 w-1.5 animate-pulse rounded-full bg-rust" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
