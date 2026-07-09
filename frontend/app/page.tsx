"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlertTriangle,
  GripVertical,
  Menu,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResearchStream } from "@/hooks/useResearchStream";
import { useChatStream } from "@/hooks/useChatStream";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConversationComposer } from "@/components/ConversationComposer";
import { ConversationPanel } from "@/components/ConversationPanel";
import { ConversationHistorySidebar } from "@/components/ConversationHistorySidebar";
import type {
  ChatHistoryMessage,
  ConversationMessage,
  ConversationMode,
  PersistedConversation,
} from "@/lib/types";

const SIDEBAR_STORAGE_KEY = "smart-briefing-agent-sidebar-width";
const CONVERSATION_HISTORY_STORAGE_KEY = "smart-briefing-conversation-history";
const LEGACY_CONVERSATION_STORAGE_KEY = "smart-briefing-conversation";
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 560;
const DEFAULT_SIDEBAR_WIDTH = 400;

const clampSidebarWidth = (width: number) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const updateMessage = (
  messages: ConversationMessage[],
  id: string,
  updater: (message: ConversationMessage) => ConversationMessage
) => messages.map((message) => (message.id === id ? updater(message) : message));

const createTimestamp = () => new Date().toISOString();

const hasRealConversation = (messages: ConversationMessage[]) =>
  messages.some((message) => message.role === "user" && message.content.trim().length > 0);

const createConversationTitle = (messages: ConversationMessage[]) => {
  const firstUserMessage = messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0
  );
  if (!firstUserMessage) return undefined;
  const title = firstUserMessage.content.trim().replace(/\s+/g, " ");
  return title.length > 80 ? `${title.slice(0, 77)}...` : title;
};

const sortConversationsByCreatedAt = (conversations: PersistedConversation[]) =>
  [...conversations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const normalizePersistedConversation = (value: unknown): PersistedConversation | null => {
  if (!value || typeof value !== "object") return null;

  const conversation = value as Partial<PersistedConversation>;
  if (
    typeof conversation.id !== "string" ||
    typeof conversation.createdAt !== "string" ||
    !Array.isArray(conversation.messages)
  ) {
    return null;
  }

  return {
    id: conversation.id,
    createdAt: conversation.createdAt,
    updatedAt: typeof conversation.updatedAt === "string" ? conversation.updatedAt : conversation.createdAt,
    title: typeof conversation.title === "string" ? conversation.title : undefined,
    messages: conversation.messages,
    latestReport: typeof conversation.latestReport === "string" ? conversation.latestReport : "",
  };
};

export default function Home() {
  const { t } = useTranslation();
  const { status, logEntries, errorMessage, isRunning, submit, abort } =
    useResearchStream();
  const { isChatRunning, chatErrorMessage, submitChat, abortChat } = useChatStream();
  const [mode, setMode] = useState<ConversationMode>("research");
  const [activeConversationId, setActiveConversationId] = useState(createId);
  const [activeConversationCreatedAt, setActiveConversationCreatedAt] = useState(createTimestamp);
  const [conversationHistory, setConversationHistory] = useState<PersistedConversation[]>([]);
  const [hasLoadedConversationHistory, setHasLoadedConversationHistory] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [latestReport, setLatestReport] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedHistory = window.localStorage.getItem(CONVERSATION_HISTORY_STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as unknown;
        const conversations = Array.isArray(parsed)
          ? parsed
              .map(normalizePersistedConversation)
              .filter((conversation): conversation is PersistedConversation => Boolean(conversation))
              .filter((conversation) => hasRealConversation(conversation.messages))
          : [];
        setConversationHistory(sortConversationsByCreatedAt(conversations));
      } catch {
        window.localStorage.removeItem(CONVERSATION_HISTORY_STORAGE_KEY);
      }
    }

    window.localStorage.removeItem(LEGACY_CONVERSATION_STORAGE_KEY);
    setHasLoadedConversationHistory(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedConversationHistory) return;

    setConversationHistory((current) => {
      const existing = current.find((conversation) => conversation.id === activeConversationId);
      const remaining = current.filter((conversation) => conversation.id !== activeConversationId);

      if (!hasRealConversation(messages)) {
        const next = sortConversationsByCreatedAt(remaining);
        window.localStorage.setItem(CONVERSATION_HISTORY_STORAGE_KEY, JSON.stringify(next));
        return next;
      }

      const next = sortConversationsByCreatedAt([
        ...remaining,
        {
          id: activeConversationId,
          createdAt: existing?.createdAt ?? activeConversationCreatedAt,
          updatedAt: createTimestamp(),
          title: existing?.title ?? createConversationTitle(messages),
          messages,
          latestReport,
        },
      ]);
      window.localStorage.setItem(CONVERSATION_HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeConversationCreatedAt, activeConversationId, hasLoadedConversationHistory, latestReport, messages]);

  useEffect(() => {
    const savedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!savedWidth) return;

    const parsedWidth = Number.parseInt(savedWidth, 10);
    if (Number.isFinite(parsedWidth)) {
      setSidebarWidth(clampSidebarWidth(parsedWidth));
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const isAnyRunning = isRunning || isChatRunning;
  const visibleError = errorMessage ?? chatErrorMessage;

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((current) => !current);
  }, []);

  const startResizing = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = sidebarWidth;

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = startX - moveEvent.clientX;
        const nextWidth = clampSidebarWidth(startWidth + delta);
        setSidebarWidth(nextWidth);
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextWidth));
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [sidebarWidth]
  );

  const chatHistory = useMemo<ChatHistoryMessage[]>(
    () =>
      messages
        .filter((message) => message.status !== "streaming" && message.content.trim())
        .slice(-12)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const handleConversationSubmit = useCallback(
    (nextMode: ConversationMode, value: string) => {
      const userMessage: ConversationMessage = {
        id: createId(),
        role: "user",
        content: value,
        createdAt: new Date().toISOString(),
        status: "done",
        kind: nextMode,
      };
      const assistantId = createId();
      const assistantMessage: ConversationMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "streaming",
        kind: nextMode,
      };

      if (nextMode === "research") {
        setLatestReport("");
        setMessages([userMessage, assistantMessage]);
        let reportDraft = "";

        void submit(value, {
          onToken: (text) => {
            reportDraft += text;
            setMessages((current) =>
              updateMessage(current, assistantId, (message) => ({
                ...message,
                content: message.content + text,
              }))
            );
          },
          onDone: () => {
            setLatestReport(reportDraft);
            setMessages((current) =>
              updateMessage(current, assistantId, (message) => ({
                ...message,
                status: "done",
              }))
            );
            setMode("chat");
          },
          onError: (message) => {
            setMessages((current) =>
              updateMessage(current, assistantId, (item) => ({
                ...item,
                content: item.content || message,
                status: "error",
              }))
            );
          },
        });
        return;
      }

      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);

      void submitChat({
        message: value,
        history: chatHistory,
        reportContext: latestReport,
        onToken: (text) => {
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              content: message.content + text,
            }))
          );
        },
        onDone: () => {
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              status: "done",
            }))
          );
        },
        onError: (message) => {
          setMessages((current) =>
            updateMessage(current, assistantId, (item) => ({
              ...item,
              content: item.content || message,
              status: "error",
            }))
          );
        },
      });
    },
    [chatHistory, latestReport, messages, submit, submitChat]
  );

  const handleAbort = useCallback(() => {
    if (isRunning) abort();
    if (isChatRunning) abortChat();
    setMessages((current) =>
      current.map((message) =>
        message.status === "streaming" ? { ...message, status: "error" } : message
      )
    );
  }, [abort, abortChat, isChatRunning, isRunning]);

  const handleNewConversation = useCallback(() => {
    if (isRunning) abort();
    if (isChatRunning) abortChat();

    setActiveConversationId(createId());
    setActiveConversationCreatedAt(createTimestamp());
    setMode("research");
    setMessages([]);
    setLatestReport("");
    setIsMobileHistoryOpen(false);
  }, [abort, abortChat, isChatRunning, isRunning]);

  const handleSelectConversation = useCallback(
    (conversation: PersistedConversation) => {
      if (isRunning) abort();
      if (isChatRunning) abortChat();

      setActiveConversationId(conversation.id);
      setActiveConversationCreatedAt(conversation.createdAt);
      setMessages(conversation.messages);
      setLatestReport(conversation.latestReport);
      setMode(
        conversation.latestReport || conversation.messages.some((message) => message.kind === "chat")
          ? "chat"
          : "research"
      );
      setIsMobileHistoryOpen(false);
    },
    [abort, abortChat, isChatRunning, isRunning]
  );

  return (
    <main className="h-screen overflow-hidden bg-paper text-ink">
      <div className="flex h-full min-h-0">
        <ConversationHistorySidebar
          conversations={conversationHistory}
          activeConversationId={activeConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          className="hidden lg:flex"
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileHistoryOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:hidden"
                aria-label={t("history.openHistory")}
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:hidden"
                aria-label={t("header.openWorkspace")}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
                <Sparkles className="h-4 w-4 text-rust" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  {t("app.title")}
                </p>
                <h1 className="truncate font-serif text-xl font-medium tracking-[-0.03em] text-ink">
                  {t("app.subtitle")}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:inline-flex"
                aria-label={
                  isSidebarCollapsed
                    ? t("header.expandWorkspace")
                    : t("header.collapseWorkspace")
                }
              >
                {isSidebarCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PanelRightClose className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {isSidebarCollapsed
                    ? t("header.openWorkspaceShort")
                    : t("header.hideWorkspaceShort")}
                </span>
              </button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-8">
                <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1.5 text-xs font-medium text-rust">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("app.badge")}
                  </div>
                  <h2 className="font-serif text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
                    {t("app.heroTitle")}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                    {t("app.heroDescription")}
                  </p>
                </div>

                <StatusBar status={status} />

                {visibleError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-surface px-5 py-4 text-sm leading-6 text-red-700 shadow-soft dark:border-red-900/60 dark:text-red-300">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300"
                      aria-hidden="true"
                    />
                    <span>{visibleError}</span>
                  </div>
                )}

                <ConversationPanel messages={messages} isRunning={isAnyRunning} />
                <div ref={scrollRef} />
              </div>
            </div>

            <div className="sticky bottom-0 shrink-0 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <ConversationComposer
                  mode={mode}
                  onModeChange={setMode}
                  onSubmit={handleConversationSubmit}
                  onAbort={handleAbort}
                  isRunning={isAnyRunning}
                  isResearchRunning={isRunning}
                  isChatRunning={isChatRunning}
                />
              </div>
            </div>
          </div>
        </section>

        {!isSidebarCollapsed && (
          <aside
            className="relative hidden h-full min-h-0 shrink-0 border-l border-line bg-surface lg:flex"
            style={{ width: sidebarWidth }}
          >
            <button
              type="button"
              onPointerDown={startResizing}
              className="absolute -left-3 top-1/2 z-10 flex h-16 w-6 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-full border border-line bg-surface text-muted shadow-soft transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
              aria-label={t("header.resizeWorkspace")}
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-h-0 w-full p-4">
              <AgentLogPanel entries={logEntries} isRunning={isRunning} />
            </div>
          </aside>
        )}
      </div>

      {isMobileHistoryOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setIsMobileHistoryOpen(false)}
            aria-label={t("history.closeHistory")}
          />
          <ConversationHistorySidebar
            conversations={conversationHistory}
            activeConversationId={activeConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onCloseMobile={() => setIsMobileHistoryOpen(false)}
            className="absolute left-0 top-0 h-full w-[min(88vw,320px)]"
          />
        </div>
      )}

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label={t("header.closeWorkspaceOverlay")}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col border-l border-line bg-surface p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {t("header.workspaceTitle")}
              </p>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
                aria-label={t("header.closeWorkspace")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AgentLogPanel entries={logEntries} isRunning={isRunning} />
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
