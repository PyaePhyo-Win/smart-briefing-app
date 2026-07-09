"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatHistoryMessage, ChatSSEEvent } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type SubmitChatArgs = {
  message: string;
  history: ChatHistoryMessage[];
  reportContext: string;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

export function useChatStream() {
  const [isChatRunning, setIsChatRunning] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submitChat = useCallback(
    async ({ message, history, reportContext, onToken, onDone, onError }: SubmitChatArgs) => {
      if (!message.trim()) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsChatRunning(true);
      setChatErrorMessage(null);

      try {
        const res = await fetch(`${API_URL}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            history,
            report_context: reportContext,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        if (!res.body) throw new Error("Streaming response is empty.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            for (const line of part.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;

              try {
                const parsed = JSON.parse(trimmed.slice(6)) as ChatSSEEvent;
                if (parsed.type === "token") {
                  onToken(parsed.text);
                } else if (parsed.type === "error") {
                  setChatErrorMessage(parsed.message);
                  onError(parsed.message);
                  return;
                } else if (parsed.type === "done") {
                  onDone();
                }
              } catch {
                // Ignore malformed stream lines.
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const messageText = err instanceof Error ? err.message : "Failed to reach backend server.";
        setChatErrorMessage(messageText);
        onError(messageText);
      } finally {
        setIsChatRunning(false);
      }
    },
    []
  );

  const abortChat = useCallback(() => {
    abortRef.current?.abort();
    setIsChatRunning(false);
  }, []);

  return { isChatRunning, chatErrorMessage, submitChat, abortChat };
}
