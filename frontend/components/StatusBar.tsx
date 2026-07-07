import type { AppStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

interface Props {
  status: AppStatus;
}

export function StatusBar({ status }: Props) {
  const isActive =
    status === "connecting" ||
    status === "researching" ||
    status === "polishing";
  const isDone = status === "done";
  const isError = status === "error";

  if (status === "idle") return null;

  return (
    <div
      className={`flex items-center gap-2.5 mb-6 text-sm px-4 py-2.5 rounded-lg border ${
        isError
          ? "bg-red-950/40 border-red-800/50 text-red-400"
          : isDone
            ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
            : "bg-gray-800/60 border-gray-700/50 text-gray-400"
      }`}
    >
      {isActive && (
        <svg
          className="animate-spin h-3.5 w-3.5 text-violet-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {isDone && <span className="text-emerald-400">✓</span>}
      {isError && <span className="text-red-400">✕</span>}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}
