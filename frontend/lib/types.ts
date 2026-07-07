export type LogEvent = {
  type: "log";
  agent: string;
  event: string;
  message: string;
  timestamp: string;
};

export type TokenEvent = { type: "token"; text: string };
export type ErrorEvent = { type: "error"; message: string };
export type DoneEvent = { type: "done" };
export type SSEEvent = LogEvent | TokenEvent | ErrorEvent | DoneEvent;

export type LogEntry = {
  id: number;
  message: string;
  agent: string;
  event: string;
  timestamp: string;
};

export type AppStatus =
  | "idle"
  | "connecting"
  | "researching"
  | "polishing"
  | "done"
  | "error";

export const STATUS_LABELS: Record<AppStatus, string> = {
  idle: "",
  connecting: "Connecting to engine...",
  researching: "Agent research in progress",
  polishing: "Generating final report",
  done: "Report Complete",
  error: "Error",
};
