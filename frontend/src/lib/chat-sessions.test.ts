import { afterEach, describe, expect, it } from "vitest";
import { testDocuments } from "../test/fixtures";
import {
  type ChatSession,
  createChatId,
  loadSessions,
  NEW_CHAT_ID,
  saveSessions,
  sortSessionsByUpdatedAtDesc,
} from "./chat-sessions";

describe("chat-sessions", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("fills pendingDocuments as empty when loading legacy sessions", () => {
    window.localStorage.setItem(
      "doc-qa.chat-sessions.v1",
      JSON.stringify([
        {
          id: "chat-legacy-1",
          title: "legacy",
          messages: [],
          loadedDocuments: [testDocuments[0]],
          createdAt: "2026-03-06T10:00:00.000Z",
          updatedAt: "2026-03-06T10:00:00.000Z",
        },
      ]),
    );

    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.pendingDocuments).toEqual([]);
    expect(sessions[0]?.currentProvider).toBe("");
    expect(sessions[0]?.currentModelName).toBe("");
  });

  it("persists and loads pendingDocuments", () => {
    const now = new Date().toISOString();
    const sample: ChatSession = {
      id: createChatId(),
      title: "sample",
      messages: [],
      loadedDocuments: [testDocuments[0]],
      pendingDocuments: [testDocuments[1]],
      currentModelConfigId: "cfg-1",
      currentProvider: "openai",
      currentModelName: "gpt-4o-mini",
      createdAt: now,
      updatedAt: now,
    };

    saveSessions([sample]);
    const sessions = loadSessions();
    expect(sessions[0]?.loadedDocuments).toEqual([testDocuments[0]]);
    expect(sessions[0]?.pendingDocuments).toEqual([testDocuments[1]]);
    expect(sessions[0]?.currentModelConfigId).toBe("cfg-1");
  });

  it("sorts sessions by updatedAt descending", () => {
    const sessions: ChatSession[] = [
      {
        id: NEW_CHAT_ID,
        title: "older",
        messages: [],
        loadedDocuments: [],
        pendingDocuments: [],
        currentProvider: "",
        currentModelName: "",
        createdAt: "2026-03-06T10:00:00.000Z",
        updatedAt: "2026-03-06T10:00:00.000Z",
      },
      {
        id: "chat-newer",
        title: "newer",
        messages: [],
        loadedDocuments: [],
        pendingDocuments: [],
        currentProvider: "",
        currentModelName: "",
        createdAt: "2026-03-06T10:30:00.000Z",
        updatedAt: "2026-03-06T10:30:00.000Z",
      },
    ];

    expect(
      sortSessionsByUpdatedAtDesc(sessions).map((item) => item.id),
    ).toEqual(["chat-newer", NEW_CHAT_ID]);
  });
});
