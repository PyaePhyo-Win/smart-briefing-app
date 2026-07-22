"use client";

import Image from "next/image";
import { LogOut, MessageSquare, PanelLeftClose, Plus, Search, Settings, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatLocalDateTime } from "@/lib/dateTime";
import type { ConversationHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationHistorySidebarProps = {
  conversations: ConversationHistoryItem[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: ConversationHistoryItem) => void;
  userDisplayName?: string;
  userImageUrl?: string;
  userPlan?: string;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  onCloseMobile?: () => void;
  className?: string;
};

const getConversationTitle = (conversation: ConversationHistoryItem) =>
  conversation.title || conversation.latestMessagePreview?.trim();

export function ConversationHistorySidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  userDisplayName,
  userImageUrl,
  userPlan,
  onOpenSettings,
  onSignOut,
  onCloseMobile,
  className,
}: ConversationHistorySidebarProps) {
  const { t } = useTranslation();
  const identityLabel = userDisplayName || t("settings.unavailable");
  const isProPlan = userPlan?.toLowerCase() === "pro";
  const planLabel = isProPlan ? t("settings.planPro") : t("settings.planFree");

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
                    {conversation.latestMessagePreview ? (
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted">
                        {conversation.latestMessagePreview}
                      </span>
                    ) : null}
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

      {(userDisplayName || onOpenSettings || onSignOut) ? (
        <div className="shrink-0 border-t border-line p-3">
          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex w-full items-center gap-2 rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>{t("settings.title")}</span>
            </button>
          ) : null}

          {userDisplayName ? (
            <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-paper/70 px-3 py-2 text-sm text-muted">
              {userImageUrl ? (
                <Image
                  src={userImageUrl}
                  alt={t("settings.avatarAlt", { name: identityLabel })}
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-rust">
                  <UserCircle className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="block min-w-0 truncate font-semibold text-ink">{identityLabel}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                    isProPlan
                      ? "border-rust/30 bg-rust/10 text-rust"
                      : "border-line bg-surface text-muted",
                  )}
                >
                  {planLabel}
                </span>
              </span>
            </div>
          ) : null}

          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{t("header.signOut")}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
