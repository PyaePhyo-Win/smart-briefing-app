import { Check, LoaderCircle, X } from "lucide-react";
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
      className={`mb-8 flex items-center gap-3 rounded-2xl border bg-surface px-5 py-3 text-sm leading-6 shadow-soft ${
        isError
          ? "border-red-200 text-red-700 dark:border-red-900/60 dark:text-red-300"
          : isDone
            ? "border-emerald-200 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300"
            : "border-line text-muted"
      }`}
    >
      {isActive && (
        <LoaderCircle
          className="h-4 w-4 shrink-0 animate-spin text-rust"
          aria-hidden="true"
        />
      )}
      {isDone && (
        <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
      )}
      {isError && (
        <X className="h-4 w-4 shrink-0 text-red-600 dark:text-red-300" aria-hidden="true" />
      )}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}
