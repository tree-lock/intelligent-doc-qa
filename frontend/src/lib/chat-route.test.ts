import { describe, expect, it } from "vitest";
import {
  resolveCurrentChatId,
  shouldRedirectInvalidChatRoute,
} from "./chat-route";
import { type ChatSession, NEW_CHAT_ID } from "./chat-sessions";

const sampleSessions: ChatSession[] = [
  {
    id: "chat-1",
    title: "sample",
    messages: [],
    loadedDocuments: [],
    pendingDocuments: [],
    currentProvider: "",
    currentModelName: "",
    createdAt: "2026-03-06T10:00:00.000Z",
    updatedAt: "2026-03-06T10:00:00.000Z",
  },
];

describe("chat-route", () => {
  it("resolves current chat id from pathname", () => {
    expect(resolveCurrentChatId("/chat", sampleSessions)).toBe(NEW_CHAT_ID);
    expect(resolveCurrentChatId("/chat/chat-1", sampleSessions)).toBe("chat-1");
    expect(resolveCurrentChatId("/chat/unknown", sampleSessions)).toBe(
      NEW_CHAT_ID,
    );
    expect(resolveCurrentChatId("/settings", sampleSessions)).toBe(NEW_CHAT_ID);
  });

  it("detects invalid chat routes that should redirect", () => {
    expect(shouldRedirectInvalidChatRoute("/chat", sampleSessions)).toBe(false);
    expect(shouldRedirectInvalidChatRoute("/chat/", sampleSessions)).toBe(true);
    expect(
      shouldRedirectInvalidChatRoute("/chat/unknown", sampleSessions),
    ).toBe(true);
    expect(shouldRedirectInvalidChatRoute("/chat/chat-1", sampleSessions)).toBe(
      false,
    );
    expect(shouldRedirectInvalidChatRoute("/settings", sampleSessions)).toBe(
      false,
    );
  });
});
