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
      className={`flex items-center gap-2.5 mb-6 text-sm px-4 py-2.5 rounded-lg border ${
        isError
          ? "bg-red-950/40 border-red-800/50 text-red-400"
          : isDone
            ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
            : "bg-gray-800/60 border-gray-700/50 text-gray-400"
      }`}
    >
      {isActive && (
        <LoaderCircle
          className="h-3.5 w-3.5 animate-spin shrink-0 text-violet-400"
          aria-hidden="true"
        />
      )}
      {isDone && (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
      )}
      {isError && (
        <X className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
      )}
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}
