import type {
  AuthUser,
  ConversationHistoryItem,
  ConversationMessage,
  ConversationMessageKind,
  ConversationRole,
  PersistedConversation,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type BackendConversationSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  latest_message_preview: string | null;
};

type BackendMessage = {
  id: string;
  role: string;
  kind: string;
  content: string;
  created_at: string;
};

type BackendReport = {
  id: string;
  polished_content: string;
  created_at: string;
};

type BackendConversationDetail = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: BackendMessage[];
  latest_report: BackendReport | null;
};

type RequestOptions = RequestInit & {
  allowUnauthorized?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // Fall back to the HTTP status text below.
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const { allowUnauthorized = false, headers, ...init } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (allowUnauthorized && response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

function mapMessage(message: BackendMessage): ConversationMessage {
  return {
    id: message.id,
    role: message.role as ConversationRole,
    kind: message.kind as ConversationMessageKind,
    content: message.content,
    createdAt: message.created_at,
    status: "done",
  };
}

function mapConversationDetail(conversation: BackendConversationDetail): PersistedConversation {
  return {
    id: conversation.id,
    title: conversation.title ?? undefined,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: conversation.messages.map(mapMessage),
    latestReport: conversation.latest_report?.polished_content ?? "",
  };
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  return apiRequest<AuthUser>("/api/auth/me", {
    method: "GET",
    allowUnauthorized: true,
  });
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return response as AuthUser;
}

export async function registerUser(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return response as AuthUser;
}

export async function logoutUser(): Promise<void> {
  await apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchConversationSummaries(): Promise<ConversationHistoryItem[]> {
  const response = await apiRequest<BackendConversationSummary[]>("/api/conversations", {
    method: "GET",
  });

  return (response ?? []).map((conversation) => ({
    id: conversation.id,
    title: conversation.title ?? undefined,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messageCount: conversation.message_count,
    latestMessagePreview: conversation.latest_message_preview ?? undefined,
  }));
}

export async function fetchConversationDetail(
  conversationId: string,
): Promise<PersistedConversation> {
  const response = await apiRequest<BackendConversationDetail>(
    `/api/conversations/${conversationId}`,
    {
      method: "GET",
    },
  );

  return mapConversationDetail(response as BackendConversationDetail);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiRequest(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
}