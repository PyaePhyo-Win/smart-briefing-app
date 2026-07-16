export type LogEvent = {
  type: "log";
  agent: string;
  event: string;
  message: string;
  timestamp?: string;
};

export type TokenEvent = { type: "token"; text: string };
export type ErrorEvent = { type: "error"; message: string };
export type DoneEvent = { type: "done"; conversation_id?: string };
export type SSEEvent = LogEvent | TokenEvent | ErrorEvent | DoneEvent;
export type ChatSSEEvent = TokenEvent | ErrorEvent | DoneEvent;

export type ConversationMode = "research" | "chat";
export type GeminiModelId = "gemini-3.5-flash" | "gemini-3.1-flash-lite" | "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-3.5-flash";

export const GEMINI_MODEL_OPTIONS: { id: GeminiModelId; label: string }[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
];

export type ConversationRole = "user" | "assistant";
export type ConversationMessageStatus = "streaming" | "done" | "error";
export type ConversationMessageKind = "research" | "chat" | "research_report";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  status?: ConversationMessageStatus;
  kind?: ConversationMessageKind;
};

export type PersistedConversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  messages: ConversationMessage[];
  latestReport: string;
};

export type ConversationHistoryItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  latestMessagePreview?: string;
  messageCount: number;
};

export type ActiveConversation = {
  id: string;
  createdAt: string;
  messages: ConversationMessage[];
  latestReport: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  plan: string;
  subscription_status: string;
  subscription_current_period_end: string | null;
};

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
