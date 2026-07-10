"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
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
  Settings,
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
  AuthUser,
  ConversationHistoryItem,
  ConversationMessage,
  ConversationMode,
  PersistedConversation,
} from "@/lib/types";
import {
  fetchConversationDetail,
  fetchConversationSummaries,
  fetchCurrentUser,
  logoutUser,
} from "@/lib/api";

const SIDEBAR_STORAGE_KEY = "smart-briefing-agent-sidebar-width";
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

type WorkspacePageProps = {
  initialConversationId?: string;
};

export function WorkspacePage({ initialConversationId }: WorkspacePageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { status, logEntries, errorMessage, isRunning, submit, abort } = useResearchStream();
  const { isChatRunning, chatErrorMessage, submitChat, abortChat } = useChatStream();
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [uiErrorMessage, setUiErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversationMode>("research");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [latestReport, setLatestReport] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resetConversationState = useCallback(() => {
    setActiveConversationId(null);
    setMode("research");
    setMessages([]);
    setLatestReport("");
  }, []);

  const applyConversation = useCallback((conversation: PersistedConversation) => {
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setLatestReport(conversation.latestReport);
    setMode(
      conversation.latestReport || conversation.messages.some((message) => message.kind === "chat")
        ? "chat"
        : "research"
    );
  }, []);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      const conversation = await fetchConversationDetail(conversationId);
      applyConversation(conversation);
      return conversation;
    },
    [applyConversation]
  );

  const loadConversationHistory = useCallback(async () => {
    const conversations = await fetchConversationSummaries();
    setConversationHistory(conversations);
    return conversations;
  }, []);

  const bootstrapWorkspace = useCallback(async () => {
    setIsInitializing(true);
    setUiErrorMessage(null);

    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setConversationHistory([]);
        resetConversationState();
        router.replace("/login");
        return;
      }

      const conversations = await loadConversationHistory();
      if (initialConversationId) {
        await loadConversation(initialConversationId);
      } else if (conversations.length > 0) {
        await loadConversation(conversations[0].id);
      } else {
        resetConversationState();
      }
    } catch (error) {
      setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
    } finally {
      setIsInitializing(false);
    }
  }, [initialConversationId, loadConversation, loadConversationHistory, resetConversationState, router, t]);

  useEffect(() => {
    void bootstrapWorkspace();
  }, [bootstrapWorkspace]);

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
  const visibleError = uiErrorMessage ?? errorMessage ?? chatErrorMessage;
  const canChat = Boolean(activeConversationId && latestReport.trim().length > 0);
  const showWorkspaceShell = Boolean(currentUser && !isInitializing);

  const refreshConversationHistory = useCallback(
    async (preferredConversationId?: string | null) => {
      const conversations = await loadConversationHistory();
      const nextId = preferredConversationId ?? activeConversationId;

      if (!conversations.length) {
        resetConversationState();
        router.replace("/");
        return;
      }

      if (!nextId || !conversations.some((conversation) => conversation.id === nextId)) {
        const conversation = await loadConversation(conversations[0].id);
        router.replace(`/conversations/${conversation.id}`);
      }
    },
    [activeConversationId, loadConversation, loadConversationHistory, resetConversationState, router]
  );

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

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
    } finally {
      setCurrentUser(null);
      setConversationHistory([]);
      resetConversationState();
      router.replace("/login");
    }
  }, [resetConversationState, router, t]);

  const handleConversationSubmit = useCallback(
    (nextMode: ConversationMode, value: string) => {
      setUiErrorMessage(null);

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
        setActiveConversationId(null);
        setLatestReport("");
        setMessages([userMessage, assistantMessage]);
        router.replace("/");
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
          onDone: async (conversationId) => {
            setLatestReport(reportDraft);
            setMessages((current) =>
              updateMessage(current, assistantId, (message) => ({
                ...message,
                status: "done",
              }))
            );
            if (!conversationId) {
              setUiErrorMessage(t("errors.backendUnreachable"));
              return;
            }

            try {
              await refreshConversationHistory(conversationId);
              await loadConversation(conversationId);
              setMode("chat");
              router.replace(`/conversations/${conversationId}`);
            } catch (error) {
              setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
            }
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

      if (!activeConversationId) {
        setUiErrorMessage(t("errors.chatRequiresConversation"));
        return;
      }

      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);

      void submitChat({
        conversationId: activeConversationId,
        message: value,
        onToken: (text) => {
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              content: message.content + text,
            }))
          );
        },
        onDone: async () => {
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              status: "done",
            }))
          );

          try {
            await refreshConversationHistory(activeConversationId);
            await loadConversation(activeConversationId);
          } catch (error) {
            setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
          }
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
    [activeConversationId, loadConversation, messages, refreshConversationHistory, router, submit, submitChat, t]
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

    setUiErrorMessage(null);
    resetConversationState();
    setIsMobileHistoryOpen(false);
    router.replace("/");
  }, [abort, abortChat, isChatRunning, isRunning, resetConversationState, router]);

  const handleSelectConversation = useCallback(
    (conversation: ConversationHistoryItem) => {
      if (isRunning) abort();
      if (isChatRunning) abortChat();

      setUiErrorMessage(null);
      setIsMobileHistoryOpen(false);
      router.replace(`/conversations/${conversation.id}`);
      void loadConversation(conversation.id).catch((error) => {
        setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
      });
    },
    [abort, abortChat, isChatRunning, isRunning, loadConversation, router, t]
  );

  return (
    <main className="h-screen overflow-hidden bg-paper text-ink">
      <div className="flex h-full min-h-0">
        {showWorkspaceShell ? (
          <ConversationHistorySidebar
            conversations={conversationHistory}
            activeConversationId={activeConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            className="hidden lg:flex"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {showWorkspaceShell ? (
                <button
                  type="button"
                  onClick={() => setIsMobileHistoryOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:hidden"
                  aria-label={t("history.openHistory")}
                >
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
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
              {showWorkspaceShell ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/settings")}
                    className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 sm:inline-flex"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span>{t("settings.title")}</span>
                  </button>
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
                </>
              ) : null}
              {currentUser ? (
                <>
                  <span className="hidden max-w-52 truncate text-sm text-muted sm:inline-block">
                    {currentUser.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-xs font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
                  >
                    {t("header.signOut")}
                  </button>
                </>
              ) : null}
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

                {isInitializing ? (
                  <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                    <p className="text-sm font-medium text-muted">{t("auth.loading")}</p>
                  </div>
                ) : null}

                {currentUser ? <StatusBar status={status} /> : null}

                {visibleError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-surface px-5 py-4 text-sm leading-6 text-red-700 shadow-soft dark:border-red-900/60 dark:text-red-300">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300"
                      aria-hidden="true"
                    />
                    <span>{visibleError}</span>
                  </div>
                )}

                {currentUser ? <ConversationPanel messages={messages} isRunning={isAnyRunning} /> : null}
                <div ref={scrollRef} />
              </div>
            </div>

            {currentUser ? (
              <div className="sticky bottom-0 shrink-0 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                  <ConversationComposer
                    mode={mode}
                    onModeChange={setMode}
                    onSubmit={handleConversationSubmit}
                    onAbort={handleAbort}
                    canChat={canChat}
                    isRunning={isAnyRunning}
                    isResearchRunning={isRunning}
                    isChatRunning={isChatRunning}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {showWorkspaceShell && !isSidebarCollapsed && (
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

      {showWorkspaceShell && isMobileHistoryOpen && (
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
