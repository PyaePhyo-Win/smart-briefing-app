"use client";

import { FormEvent, useState } from "react";
import { Bot, FlaskConical, Send, X } from "lucide-react";
import type { ConversationMode } from "@/lib/types";

interface Props {
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  onSubmit: (mode: ConversationMode, value: string) => void;
  onAbort: () => void;
  isRunning: boolean;
  isResearchRunning: boolean;
  isChatRunning: boolean;
}

const MODE_CONFIG: Record<ConversationMode, { label: string; placeholder: string; maxLength: number }> = {
  research: {
    label: "Research",
    placeholder: "Ask the agents to research a topic...",
    maxLength: 300,
  },
  chat: {
    label: "Chat",
    placeholder: "Ask about the report or continue the conversation...",
    maxLength: 2000,
  },
};

export function ConversationComposer({
  mode,
  onModeChange,
  onSubmit,
  onAbort,
  isRunning,
  isResearchRunning,
  isChatRunning,
}: Props) {
  const [value, setValue] = useState("");
  const activeConfig = MODE_CONFIG[mode];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onSubmit(mode, trimmed);
    setValue("");
  };

  const actionLabel = isResearchRunning
    ? "Researching"
    : isChatRunning
      ? "Chatting"
      : activeConfig.label;

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-line bg-surface p-2 shadow-soft">
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1 pt-1">
          {(["research", "chat"] as ConversationMode[]).map((item) => {
            const isActive = item === mode;
            const Icon = item === "research" ? FlaskConical : Bot;

            return (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                disabled={isRunning}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "border-rust bg-rust text-white"
                    : "border-line bg-paper/60 text-muted hover:border-rust hover:text-rust"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {MODE_CONFIG[item].label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label htmlFor="conversation-message" className="sr-only">
            {activeConfig.placeholder}
          </label>
          <textarea
            id="conversation-message"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={activeConfig.placeholder}
            disabled={isRunning}
            maxLength={activeConfig.maxLength}
            rows={1}
            className="max-h-36 min-h-14 flex-1 resize-none rounded-2xl border border-transparent bg-surface px-4 py-4 text-sm leading-6 text-ink placeholder:text-muted/70 outline-none transition duration-200 focus:border-rust focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {isRunning ? (
            <button
              type="button"
              onClick={onAbort}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-surface px-6 py-4 text-sm font-semibold text-ink transition duration-200 hover:border-rust hover:text-rust disabled:opacity-60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-rust px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-rust/90 focus:outline-none focus:ring-4 focus:ring-rust/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {value.length > activeConfig.maxLength - 50 && (
        <p className="ml-3 mt-2 text-xs text-rust">
          {activeConfig.maxLength - value.length} characters remaining
        </p>
      )}
    </form>
  );
}
