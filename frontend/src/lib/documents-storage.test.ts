import { afterEach, describe, expect, it } from "vitest";
import { type DocumentItem } from "../types";
import {
  DOCUMENTS_STORAGE_KEY,
  loadDocuments,
  removeDocumentsByIds,
  saveDocuments,
  upsertDocuments,
} from "./documents-storage";

function createDocument(partial: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: partial.id ?? "doc-1",
    name: partial.name ?? "demo.txt",
    title: partial.title ?? "demo.txt",
    plainText: partial.plainText ?? "hello world",
    type: partial.type ?? "txt",
    status: partial.status ?? "ready",
    updatedAt: partial.updatedAt ?? "2026-03-06 10:00:00",
  };
}

describe("documents-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns empty array when storage is empty", () => {
    expect(loadDocuments()).toEqual([]);
  });

  it("is backward compatible with legacy records", () => {
    window.localStorage.setItem(
      DOCUMENTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "doc-legacy",
          name: "legacy.md",
          type: "markdown",
          status: "ready",
          updatedAt: "2026-03-06 10:00:00",
        },
      ]),
    );

    expect(loadDocuments()).toEqual([
      createDocument({
        id: "doc-legacy",
        name: "legacy.md",
        title: "legacy.md",
        plainText: "",
        type: "markdown",
      }),
    ]);
  });

  it("ignores malformed payloads", () => {
    window.localStorage.setItem(DOCUMENTS_STORAGE_KEY, "{invalid json");
    expect(loadDocuments()).toEqual([]);
  });

  it("upserts and removes documents by id", () => {
    saveDocuments([
      createDocument({ id: "doc-1", updatedAt: "2026-03-06 09:00:00" }),
      createDocument({
        id: "doc-2",
        name: "a.md",
        title: "a.md",
        type: "markdown",
      }),
    ]);

    const merged = upsertDocuments([
      createDocument({ id: "doc-2", plainText: "next" }),
      createDocument({ id: "doc-3", name: "b.txt", title: "b.txt" }),
    ]);

    expect(merged.map((item) => item.id)).toEqual(["doc-2", "doc-3", "doc-1"]);

    const removed = removeDocumentsByIds(["doc-2"]);
    expect(removed.map((item) => item.id)).toEqual(["doc-3", "doc-1"]);
  });
});
