export type LogEvent = {
  type: "log";
  agent: string;
  event: string;
  message: string;
  timestamp: string;
};

export type TokenEvent = { type: "token"; text: string };
export type ErrorEvent = { type: "error"; message: string };
export type DoneEvent = { type: "done"; conversation_id?: string };
export type SSEEvent = LogEvent | TokenEvent | ErrorEvent | DoneEvent;
export type ChatSSEEvent = TokenEvent | ErrorEvent | DoneEvent;

export type ConversationMode = "research" | "chat";
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
