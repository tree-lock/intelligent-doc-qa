import {
  type ChatSession,
  loadSessions,
  saveSessions,
  sortSessionsByUpdatedAtDesc,
} from "../chat-sessions";

export async function fetchChatSessions(): Promise<ChatSession[]> {
  return sortSessionsByUpdatedAtDesc(loadSessions());
}

export async function persistChatSessions(
  sessions: ChatSession[],
): Promise<ChatSession[]> {
  const sortedSessions = sortSessionsByUpdatedAtDesc(sessions);
  saveSessions(sortedSessions);
  return sortedSessions;
}
