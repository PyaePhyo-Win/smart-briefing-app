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
  Sparkles,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResearchStream } from "@/hooks/useResearchStream";
import { useChatStream } from "@/hooks/useChatStream";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { ConversationComposer } from "@/components/ConversationComposer";
import { ConversationPanel } from "@/components/ConversationPanel";
import { ConversationHistorySidebar } from "@/components/ConversationHistorySidebar";
import { useAuth } from "@/components/AuthProvider";
import {
  AUTH_SUCCESS_TRANSITION_DURATION_MS,
  AUTH_SUCCESS_TRANSITION_STORAGE_KEY,
} from "@/components/AuthSuccessTransitionProvider";
import {
  DEFAULT_GEMINI_MODEL,
  type ConversationHistoryItem,
  type ConversationMessage,
  type ConversationMode,
  type GeminiModelId,
  type PersistedConversation,
} from "@/lib/types";
import {
  fetchConversationDetail,
  fetchConversationSummaries,
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
  const { user: currentUser, isLoading: isAuthLoading, logout } = useAuth();
  const { status, logEntries, errorMessage, isRunning, submit, abort, clear: clearResearchState } = useResearchStream();
  const { isChatRunning, chatErrorMessage, submitChat, abortChat } = useChatStream();
  const [isInitializing, setIsInitializing] = useState(true);
  const [uiErrorMessage, setUiErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversationMode>("research");
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [, setLatestReport] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [shouldPlayAuthEntrance, setShouldPlayAuthEntrance] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const historyOpenButtonRef = useRef<HTMLButtonElement | null>(null);
  const workspaceOpenButtonRef = useRef<HTMLButtonElement | null>(null);
  const historyDialogRef = useRef<HTMLDivElement | null>(null);
  const workspaceDialogRef = useRef<HTMLDivElement | null>(null);
  const conversationLoadIdRef = useRef(0);

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
      const loadId = conversationLoadIdRef.current + 1;
      conversationLoadIdRef.current = loadId;
      const conversation = await fetchConversationDetail(conversationId);
      if (loadId === conversationLoadIdRef.current) {
        applyConversation(conversation);
      }
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
    if (isAuthLoading) return;

    setIsInitializing(true);
    setUiErrorMessage(null);

    if (!currentUser) {
      setConversationHistory([]);
      resetConversationState();
      router.replace("/login");
      setIsInitializing(false);
      return;
    }

    try {
      await loadConversationHistory();
      if (initialConversationId) {
        await loadConversation(initialConversationId);
      } else {
        resetConversationState();
        router.replace("/");
      }
    } catch (error) {
      setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
    } finally {
      setIsInitializing(false);
    }
  }, [currentUser, initialConversationId, isAuthLoading, loadConversation, loadConversationHistory, resetConversationState, router, t]);

  useEffect(() => {
    void bootstrapWorkspace();
  }, [bootstrapWorkspace]);

  useEffect(() => {
    if (!currentUser) return;

    const transitionMode = window.sessionStorage.getItem(AUTH_SUCCESS_TRANSITION_STORAGE_KEY);
    if (transitionMode !== "login" && transitionMode !== "register") return;

    window.sessionStorage.removeItem(AUTH_SUCCESS_TRANSITION_STORAGE_KEY);
    setShouldPlayAuthEntrance(true);

    const timeoutId = window.setTimeout(() => {
      setShouldPlayAuthEntrance(false);
    }, AUTH_SUCCESS_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentUser]);

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

  const closeMobileHistory = useCallback(() => {
    setIsMobileHistoryOpen(false);
    historyOpenButtonRef.current?.focus();
  }, []);

  const closeMobileWorkspace = useCallback(() => {
    setIsMobileSidebarOpen(false);
    workspaceOpenButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const dialog = isMobileHistoryOpen
      ? historyDialogRef.current
      : isMobileSidebarOpen
        ? workspaceDialogRef.current
        : null;
    if (!dialog) return;

    const focusable = dialog.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
    );
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isMobileHistoryOpen) {
        closeMobileHistory();
      } else {
        closeMobileWorkspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileHistory, closeMobileWorkspace, isMobileHistoryOpen, isMobileSidebarOpen]);

  const isAnyRunning = isRunning || isChatRunning;
  const visibleError = uiErrorMessage ?? errorMessage ?? chatErrorMessage;
  const showWorkspaceShell = Boolean(currentUser && !isInitializing && !isAuthLoading);
  const isEmptyWorkspace = Boolean(
    currentUser && !isInitializing && !visibleError && messages.length === 0,
  );

  const refreshConversationHistory = useCallback(
    async (preferredConversationId?: string | null) => {
      const conversations = await loadConversationHistory();
      const nextId = preferredConversationId ?? activeConversationId;

      if (nextId && conversations.some((conversation) => conversation.id === nextId)) {
        return;
      }

      resetConversationState();
      router.replace("/");
    },
    [activeConversationId, loadConversationHistory, resetConversationState, router]
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
      await logout();
    } catch (error) {
      setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
    } finally {
      setConversationHistory([]);
      resetConversationState();
      router.replace("/login");
    }
  }, [logout, resetConversationState, router, t]);

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
      const submissionLoadId = conversationLoadIdRef.current;

      if (nextMode === "research") {
        const targetConversationId = activeConversationId;
        const nextMessages = targetConversationId
          ? [...messages, userMessage, assistantMessage]
          : [userMessage, assistantMessage];

        setLatestReport("");
        setMessages(nextMessages);
        setMode("research");
        if (!targetConversationId) {
          router.replace("/");
        }
        let reportDraft = "";

        void submit({
          topic: value,
          model: selectedModel,
          conversationId: targetConversationId,
          callbacks: {
            onToken: (text) => {
              if (submissionLoadId !== conversationLoadIdRef.current) return;
              reportDraft += text;
              setMessages((current) =>
                updateMessage(current, assistantId, (message) => ({
                  ...message,
                  content: message.content + text,
                }))
              );
            },
            onDone: async (conversationId) => {
              if (submissionLoadId !== conversationLoadIdRef.current) return;
              setLatestReport(reportDraft);
              setMessages((current) =>
                updateMessage(current, assistantId, (message) => ({
                  ...message,
                  status: "done",
                }))
              );

              const resolvedConversationId = conversationId ?? targetConversationId;
              if (!resolvedConversationId) {
                setUiErrorMessage(t("errors.backendUnreachable"));
                return;
              }

              try {
                await refreshConversationHistory(resolvedConversationId);
                await loadConversation(resolvedConversationId);
                setMode("chat");
                router.replace(`/conversations/${resolvedConversationId}`);
              } catch (error) {
                setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
              }
            },
            onError: (message) => {
              if (submissionLoadId !== conversationLoadIdRef.current) return;
              setMessages((current) =>
                updateMessage(current, assistantId, (item) => ({
                  ...item,
                  content: item.content || message,
                  status: "error",
                }))
              );
            },
          },
        });
        return;
      }

      const nextMessages = activeConversationId
        ? [...messages, userMessage, assistantMessage]
        : [userMessage, assistantMessage];
      setMessages(nextMessages);
      setMode("chat");

      void submitChat({
        conversationId: activeConversationId,
        message: value,
        model: selectedModel,
        onToken: (text) => {
          if (submissionLoadId !== conversationLoadIdRef.current) return;
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              content: message.content + text,
            }))
          );
        },
        onDone: async (conversationId) => {
          if (submissionLoadId !== conversationLoadIdRef.current) return;
          setMessages((current) =>
            updateMessage(current, assistantId, (message) => ({
              ...message,
              status: "done",
            }))
          );

          const resolvedConversationId = conversationId ?? activeConversationId;
          if (!resolvedConversationId) {
            setUiErrorMessage(t("errors.backendUnreachable"));
            return;
          }

          try {
            await refreshConversationHistory(resolvedConversationId);
            await loadConversation(resolvedConversationId);
            setMode("chat");
            router.replace(`/conversations/${resolvedConversationId}`);
          } catch (error) {
            setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
          }
        },
        onError: (message) => {
          if (submissionLoadId !== conversationLoadIdRef.current) return;
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
    [activeConversationId, loadConversation, messages, refreshConversationHistory, router, selectedModel, submit, submitChat, t]
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

    conversationLoadIdRef.current += 1;
    clearResearchState();
    setUiErrorMessage(null);
    resetConversationState();
    closeMobileHistory();
    router.replace("/");
  }, [abort, abortChat, clearResearchState, closeMobileHistory, isChatRunning, isRunning, resetConversationState, router]);

  const handleSelectConversation = useCallback(
    (conversation: ConversationHistoryItem) => {
      if (isRunning) abort();
      if (isChatRunning) abortChat();

      conversationLoadIdRef.current += 1;
      clearResearchState();
      setUiErrorMessage(null);
      closeMobileHistory();
      router.replace(`/conversations/${conversation.id}`);
      void loadConversation(conversation.id).catch((error) => {
        setUiErrorMessage(error instanceof Error ? error.message : t("errors.backendUnreachable"));
      });
    },
    [abort, abortChat, clearResearchState, closeMobileHistory, isChatRunning, isRunning, loadConversation, router, t]
  );

  return (
    <main className={`h-screen overflow-hidden bg-paper text-ink${shouldPlayAuthEntrance ? " workspace-auth-success-enter" : ""}`}>
      <div className="flex h-full min-h-0">
        {showWorkspaceShell ? (
          <ConversationHistorySidebar
            conversations={conversationHistory}
            activeConversationId={activeConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            userDisplayName={currentUser?.display_name ?? currentUser?.username}
            userImageUrl={currentUser?.profile_image_url ?? undefined}
            userPlan={currentUser?.plan}
            onOpenSettings={() => {
              closeMobileHistory();
              router.push("/settings");
            }}
            onSignOut={() => void handleLogout()}
            className="hidden lg:flex"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {showWorkspaceShell ? (
                <button
                  ref={historyOpenButtonRef}
                  type="button"
                  onClick={() => setIsMobileHistoryOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:hidden"
                  aria-label={t("history.openHistory")}
                >
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              <button
                ref={workspaceOpenButtonRef}
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
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:inline-flex"
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
                </button>
              ) : null}
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div
                className={`mx-auto flex max-w-4xl flex-col gap-5 pb-8 ${
                  isEmptyWorkspace ? "min-h-full justify-center" : ""
                }`}
              >

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
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onSubmit={handleConversationSubmit}
                    onAbort={handleAbort}
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
        <div
          ref={historyDialogRef}
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={closeMobileHistory}
            aria-label={t("history.closeHistory")}
          />
          <ConversationHistorySidebar
            conversations={conversationHistory}
            activeConversationId={activeConversationId}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            userDisplayName={currentUser?.display_name ?? currentUser?.username}
            userImageUrl={currentUser?.profile_image_url ?? undefined}
            userPlan={currentUser?.plan}
            onOpenSettings={() => {
              closeMobileHistory();
              router.push("/settings");
            }}
            onSignOut={() => void handleLogout()}
            onCloseMobile={closeMobileHistory}
            className="absolute left-0 top-0 h-full w-[min(88vw,320px)]"
          />
        </div>
      )}

      {isMobileSidebarOpen && (
        <div
          ref={workspaceDialogRef}
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={closeMobileWorkspace}
            aria-label={t("header.closeWorkspaceOverlay")}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col border-l border-line bg-surface p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {t("header.workspaceTitle")}
              </p>
              <button
                type="button"
                onClick={closeMobileWorkspace}
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
