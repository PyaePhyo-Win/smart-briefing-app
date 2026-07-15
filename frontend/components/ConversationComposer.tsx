"use client";

import { FormEvent, useState } from "react";
import { Bot, FlaskConical, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GEMINI_MODEL_OPTIONS,
  type ConversationMode,
  type GeminiModelId,
} from "@/lib/types";

interface Props {
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  selectedModel: GeminiModelId;
  onModelChange: (model: GeminiModelId) => void;
  onSubmit: (mode: ConversationMode, value: string) => void;
  onAbort: () => void;
  isRunning: boolean;
  isResearchRunning: boolean;
  isChatRunning: boolean;
}

const MODE_CONFIG: Record<ConversationMode, { maxLength: number }> = {
  research: {
    maxLength: 300,
  },
  chat: {
    maxLength: 2000,
  },
};

export function ConversationComposer({
  mode,
  onModeChange,
  selectedModel,
  onModelChange,
  onSubmit,
  onAbort,
  isRunning,
  isResearchRunning,
  isChatRunning,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const activeConfig = MODE_CONFIG[mode];
  const activeLabel = mode === "research" ? t("composer.research") : t("composer.chat");
  const activePlaceholder =
    mode === "research"
      ? t("composer.researchPlaceholder")
      : t("composer.chatPlaceholder");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onSubmit(mode, trimmed);
    setValue("");
  };

  const actionLabel = isResearchRunning
    ? t("composer.researching")
    : isChatRunning
      ? t("composer.chatting")
      : activeLabel;

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
                {item === "research" ? t("composer.research") : t("composer.chat")}
              </button>
            );
          })}

          <div className="flex flex-1 flex-col gap-1 sm:ml-auto max-w-[175px]">
            <label id="gemini-model-label" className="px-1 text-xs font-semibold text-muted">
              {t("composer.modelLabel")}
            </label>
            <Select
              value={selectedModel}
              onValueChange={(model) => onModelChange(model as GeminiModelId)}
              disabled={isRunning}
            >
              <SelectTrigger
                aria-labelledby="gemini-model-label"
                className="h-9 bg-paper/60 text-xs"
              >
                <SelectValue placeholder={t("composer.modelPlaceholder")} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectLabel>{t("composer.modelLabel")}</SelectLabel>
                  {GEMINI_MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label htmlFor="conversation-message" className="sr-only">
            {activePlaceholder}
          </label>
          <textarea
            id="conversation-message"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={activePlaceholder}
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
              {t("composer.cancel")}
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
          {t("composer.charactersRemaining", {
            count: activeConfig.maxLength - value.length,
          })}
        </p>
      )}
    </form>
  );
}
