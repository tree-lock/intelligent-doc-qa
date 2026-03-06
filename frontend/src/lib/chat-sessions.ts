import { type DocumentItem, type ChatMessage } from "../types";

export type ChatSessionId = string;

export type ChatSession = {
  id: ChatSessionId;
  title: string;
  messages: ChatMessage[];
  loadedDocuments: DocumentItem[];
  pendingDocuments: DocumentItem[];
  createdAt: string;
  updatedAt: string;
};

const CHAT_SESSIONS_STORAGE_KEY = "doc-qa.chat-sessions.v1";

export const NEW_CHAT_ID = "new";

const isBrowser = typeof window !== "undefined";

export function createChatId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSessionTitle(firstUserMessage: string) {
  const normalized = firstUserMessage.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "新对话";
  }

  const maxLength = 24;
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}

export function sortSessionsByUpdatedAtDesc(sessions: ChatSession[]) {
  return [...sessions].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function loadSessions() {
  if (!isBrowser) {
    return [] as ChatSession[];
  }

  try {
    const rawValue = window.localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (!rawValue) {
      return [] as ChatSession[];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [] as ChatSession[];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          Array.isArray(item.messages) &&
          Array.isArray(item.loadedDocuments) &&
          typeof item.createdAt === "string" &&
          typeof item.updatedAt === "string",
      )
      .map((item) => ({
        ...item,
        pendingDocuments: Array.isArray(item.pendingDocuments)
          ? item.pendingDocuments
          : [],
      })) as ChatSession[];
  } catch {
    return [] as ChatSession[];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(
      CHAT_SESSIONS_STORAGE_KEY,
      JSON.stringify(sessions),
    );
  } catch {
    // Ignore persistence failures in UI skeleton mode.
  }
}
