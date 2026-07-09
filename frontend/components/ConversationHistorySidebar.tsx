"use client";

import { MessageSquare, PanelLeftClose, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatLocalDateTime } from "@/lib/dateTime";
import type { PersistedConversation } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationHistorySidebarProps = {
  conversations: PersistedConversation[];
  activeConversationId: string;
  onNewConversation: () => void;
  onSelectConversation: (conversation: PersistedConversation) => void;
  onCloseMobile?: () => void;
  className?: string;
};

const getConversationTitle = (conversation: PersistedConversation) => {
  const firstUserMessage = conversation.messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );

  return conversation.title || firstUserMessage?.content.trim();
};

export function ConversationHistorySidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onCloseMobile,
  className,
}: ConversationHistorySidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "flex h-full w-72 shrink-0 flex-col border-r border-line bg-surface/80 text-ink shadow-soft backdrop-blur",
        className,
      )}
      aria-label={t("history.title")}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">
            {t("history.eyebrow")}
          </p>
          <h2 className="truncate text-sm font-semibold text-ink">{t("history.title")}</h2>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full border border-line bg-paper p-2 text-muted transition hover:border-line-strong hover:text-ink lg:hidden"
            aria-label={t("history.closeHistory")}
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="border-b border-line p-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line-strong bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-soft transition hover:-translate-y-0.5 hover:bg-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("history.newChat")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-paper/70 px-4 py-10 text-center">
            <Search className="mb-3 h-8 w-8 text-rust" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink">{t("history.emptyTitle")}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{t("history.emptyBody")}</p>
          </div>
        ) : (
          <nav className="space-y-2" aria-label={t("history.title")}>
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const title = getConversationTitle(conversation) || t("history.conversationFallbackTitle");

              return (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                    isActive
                      ? "border-rust/50 bg-rust/10 text-ink shadow-soft"
                      : "border-transparent bg-paper/60 text-muted hover:border-line hover:bg-paper hover:text-ink",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "mt-0.5 rounded-xl border p-2",
                      isActive
                        ? "border-rust/30 bg-rust/10 text-rust"
                        : "border-line bg-surface text-muted group-hover:text-rust",
                    )}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold leading-5">{title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {t("history.createdAt", {
                        value: formatLocalDateTime(conversation.createdAt),
                      })}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}
