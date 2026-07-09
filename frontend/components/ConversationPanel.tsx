"use client";

import { useCallback, useState } from "react";
import { Bot, Check, ClipboardCopy, FileText, FlaskConical, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import type { ConversationMessage } from "@/lib/types";

interface Props {
  messages: ConversationMessage[];
  isRunning: boolean;
}

export function ConversationPanel({ messages, isRunning }: Props) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (message: ConversationMessage) => {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (messages.length === 0) {
    return (
      <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-line bg-surface p-4 shadow-soft sm:p-6">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.5rem] border border-line bg-paper/45 p-8 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-rust">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="font-serif text-2xl text-ink">{t("conversation.emptyTitle")}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            {t("conversation.emptyBody")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const isResearch = message.kind === "research";
        const Icon = isUser ? User : isResearch ? FlaskConical : Bot;
        const canCopy = !isUser && message.content && message.status !== "streaming";

        return (
          <article
            key={message.id}
            className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {!isUser && (
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-rust shadow-soft">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            )}

            <div className={`min-w-0 ${isUser ? "max-w-[82%]" : "max-w-[92%] flex-1"}`}>
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {isUser
                    ? t("conversation.you")
                    : isResearch
                      ? t("conversation.researchReport")
                      : t("conversation.assistant")}
                </p>
                {canCopy && (
                  <button
                    type="button"
                    onClick={() => handleCopy(message)}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-rust hover:text-rust"
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {copiedId === message.id ? t("conversation.copied") : t("conversation.copy")}
                  </button>
                )}
              </div>

              <div
                className={`rounded-[1.5rem] border p-5 shadow-soft sm:p-6 ${
                  isUser
                    ? "border-rust/20 bg-rust text-white"
                    : message.status === "error"
                      ? "border-red-200 bg-surface text-red-700 dark:border-red-900/60 dark:text-red-300"
                      : "border-line bg-surface text-ink"
                }`}
              >
                {message.content ? (
                  isUser ? (
                    <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                  ) : (
                    <div className="prose prose-stone max-w-none text-ink prose-headings:font-serif prose-headings:text-ink prose-p:leading-8 prose-a:text-rust prose-strong:text-ink prose-code:rounded-md prose-code:bg-line prose-code:px-1.5 prose-code:py-0.5 prose-code:text-ink prose-pre:border prose-pre:border-line prose-pre:bg-ink prose-pre:text-paper dark:prose-invert dark:prose-code:bg-line/70">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      {message.status === "streaming" && (
                        <span className="ml-1 inline-block h-5 w-2 animate-pulse rounded-full bg-rust align-middle" />
                      )}
                    </div>
                  )
                ) : (
                  <div className="space-y-3" aria-label={t("conversation.generatingResponse")}>
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-4 animate-pulse rounded-full bg-line" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isUser && (
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rust/20 bg-rust text-white shadow-soft">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
          </article>
        );
      })}

      {isRunning && <div className="h-4" aria-hidden="true" />}
    </section>
  );
}
