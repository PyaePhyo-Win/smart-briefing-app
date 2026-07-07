"use client";
import { useRef, useEffect } from "react";
import type { LogEntry } from "@/lib/types";

interface Props {
  entries: LogEntry[];
  isRunning: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  tool_started: "text-amber-400",
  tool_finished: "text-emerald-400",
  reasoning_started: "text-violet-400",
  reasoning_completed: "text-violet-300",
  task_started: "text-cyan-400",
  task_completed: "text-cyan-300",
  execution_started: "text-sky-400",
  execution_completed: "text-sky-300",
  status: "text-gray-400",
};

export function AgentLogPanel({ entries, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Agent Workspace
        </h2>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="bg-gray-950 rounded-xl border border-gray-800/80 h-[580px] overflow-y-auto font-mono text-xs p-4 space-y-1">
        {entries.length === 0 && !isRunning && (
          <p className="text-gray-600 italic select-none">
            Submit a topic to begin...
          </p>
        )}
        {entries.length === 0 && isRunning && (
          <p className="text-gray-600 animate-pulse">
            Waiting for agent events...
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="leading-relaxed group">
            <span className="text-gray-700 select-none">
              {entry.timestamp.slice(11, 19)}
            </span>
            <span className="text-gray-700 mx-2 select-none">│</span>
            <span
              className={`font-medium ${
                entry.agent === "System" ? "text-cyan-500" : "text-gray-500"
              } mr-2`}
            >
              {entry.agent}
            </span>
            <span className={EVENT_COLORS[entry.event] ?? "text-gray-300"}>
              {entry.message}
            </span>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-1 pt-0.5">
            <span className="text-gray-700 select-none">——</span>
            <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse rounded-sm" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
