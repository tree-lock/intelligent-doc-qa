import {
  type ChatSession,
  sortSessionsByUpdatedAtDesc,
} from "../chat-sessions";
import { apiFetch } from "./client";

export async function fetchChatSessions(): Promise<ChatSession[]> {
  const sessions = await apiFetch<ChatSession[]>("/api/v1/chat/sessions");
  return sortSessionsByUpdatedAtDesc(sessions);
}

export async function persistChatSessions(
  sessions: ChatSession[],
): Promise<ChatSession[]> {
  const persistedSessions = await apiFetch<ChatSession[]>(
    "/api/v1/chat/sessions",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessions),
    },
  );
  return sortSessionsByUpdatedAtDesc(persistedSessions);
}
