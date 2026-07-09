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
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
} from "lucide-react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { useChatStream } from "@/hooks/useChatStream";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConversationComposer } from "@/components/ConversationComposer";
import { ConversationPanel } from "@/components/ConversationPanel";
import type {
  ChatHistoryMessage,
  ConversationMessage,
  ConversationMode,
  PersistedConversation,
} from "@/lib/types";

const SIDEBAR_STORAGE_KEY = "smart-briefing-agent-sidebar-width";
const CONVERSATION_STORAGE_KEY = "smart-briefing-conversation";
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

export default function Home() {
  const { status, logEntries, errorMessage, isRunning, submit, abort } =
    useResearchStream();
  const { isChatRunning, chatErrorMessage, submitChat, abortChat } = useChatStream();
  const [mode, setMode] = useState<ConversationMode>("research");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [latestReport, setLatestReport] = useState("");
  const [hasLoadedConversation, setHasLoadedConversation] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!savedWidth) return;

    const parsedWidth = Number.parseInt(savedWidth, 10);
    if (Number.isFinite(parsedWidth)) {
      setSidebarWidth(clampSidebarWidth(parsedWidth));
    }
  }, []);

  useEffect(() => {
    const savedConversation = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation) as PersistedConversation;
        setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
        setLatestReport(typeof parsed.latestReport === "string" ? parsed.latestReport : "");
      } catch {
        window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      }
    }
    setHasLoadedConversation(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedConversation) return;
    const payload: PersistedConversation = { messages, latestReport };
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(payload));
  }, [hasLoadedConversation, latestReport, messages]);

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

  return (
    <main className="h-screen overflow-hidden bg-paper text-ink">
      <div className="flex h-full min-h-0">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 lg:hidden"
                aria-label="Open agent workspace"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-soft">
                <Sparkles className="h-4 w-4 text-rust" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  Smart Briefing
                </p>
                <h1 className="truncate font-serif text-xl font-medium tracking-[-0.03em] text-ink">
                  Research Chat
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
                    ? "Expand agent workspace"
                    : "Collapse agent workspace"
                }
              >
                {isSidebarCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PanelRightClose className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isSidebarCollapsed ? "Open Workspace" : "Hide Workspace"}</span>
              </button>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-8">
                <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rust/20 bg-rust/5 px-3 py-1.5 text-xs font-medium text-rust">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    AI Research Briefing
                  </div>
                  <h2 className="font-serif text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
                    Research with agents. Then chat with the report.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                    Start a fresh agent research thread, then switch to Chat to ask follow-up questions using the latest report as context.
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
              aria-label="Resize agent workspace"
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-h-0 w-full p-4">
              <AgentLogPanel entries={logEntries} isRunning={isRunning} />
            </div>
          </aside>
        )}
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/35"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close agent workspace overlay"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col border-l border-line bg-surface p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Agent Workspace
              </p>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10"
                aria-label="Close agent workspace"
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
