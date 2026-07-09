"use client";

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
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
} from "lucide-react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { ResearchForm } from "@/components/ResearchForm";
import { StatusBar } from "@/components/StatusBar";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

const SIDEBAR_STORAGE_KEY = "smart-briefing-agent-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 560;

const clampSidebarWidth = (width: number) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

export default function Home() {
  const { status, logEntries, report, errorMessage, isRunning, submit, abort } =
    useResearchStream();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const savedWidth = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!savedWidth) return;

    const parsedWidth = Number(savedWidth);
    if (Number.isFinite(parsedWidth)) {
      setSidebarWidth(clampSidebarWidth(parsedWidth));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  const startResizing = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      isResizingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const nextWidth = window.innerWidth - moveEvent.clientX;
        setSidebarWidth(clampSidebarWidth(nextWidth));
      };

      const stopResizing = () => {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResizing);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopResizing, { once: true });
    },
    []
  );

  const toggleSidebar = () => setIsSidebarCollapsed((current) => !current);

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
                    What should the research agents brief you on?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                    Ask for a focused briefing and the report will stream here as an assistant response while the agent workspace tracks live activity.
                  </p>
                </div>

                <StatusBar status={status} />

                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-surface px-5 py-4 text-sm leading-6 text-red-700 shadow-soft dark:border-red-900/60 dark:text-red-300">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300"
                      aria-hidden="true"
                    />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <ReportPanel report={report} status={status} isRunning={isRunning} />
              </div>
            </div>

            <div className="sticky bottom-0 shrink-0 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <ResearchForm
                  onSubmit={submit}
                  onAbort={abort}
                  status={status}
                  isRunning={isRunning}
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
