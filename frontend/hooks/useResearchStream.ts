"use client";
import { useState, useRef, useCallback } from "react";
import type { LogEntry, AppStatus, SSEEvent } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useResearchStream() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [report, setReport] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((entry: LogEntry) => {
    setLogEntries((prev) => [...prev, entry]);
  }, []);

  const reset = useCallback(() => {
    setStatus("connecting");
    setErrorMessage(null);
    setReport("");
    setLogEntries([]);
    logIdRef.current = 0;
  }, []);

  const submit = useCallback(
    async (topic: string) => {
      if (!topic.trim()) return;
      reset();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${API_URL}/api/research/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topic.trim() }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // SSE events are delimited by double newlines
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            for (const line of part.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              try {
                const parsed = JSON.parse(trimmed.slice(6)) as SSEEvent;
                if (parsed.type === "log") {
                  logIdRef.current += 1;
                  addLog({
                    id: logIdRef.current,
                    message: parsed.message,
                    agent: parsed.agent,
                    event: parsed.event,
                    timestamp: parsed.timestamp ?? new Date().toISOString(),
                  });
                  setStatus((prev) =>
                    prev === "connecting" || prev === "researching"
                      ? "researching"
                      : prev
                  );
                } else if (parsed.type === "token") {
                  setStatus("polishing");
                  setReport((prev) => prev + parsed.text);
                } else if (parsed.type === "error") {
                  setErrorMessage(parsed.message);
                  setStatus("error");
                  return;
                } else if (parsed.type === "done") {
                  setStatus("done");
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to reach backend server."
        );
        setStatus("error");
      }
    },
    [reset, addLog]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const isRunning =
    status === "connecting" ||
    status === "researching" ||
    status === "polishing";

  return { status, logEntries, report, errorMessage, isRunning, submit, abort };
}
