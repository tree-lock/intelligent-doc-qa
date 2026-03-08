import { describe, expect, it } from "vitest";
import type { DocumentItem } from "../types";
import { filterDocumentsByQuery } from "./document-filter";

function createDocument(partial: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: partial.id ?? "doc-1",
    name: partial.name ?? "demo.txt",
    title: partial.title ?? "demo.txt",
    plainText: partial.plainText ?? "",
    type: partial.type ?? "txt",
    status: partial.status ?? "ready",
    updatedAt: partial.updatedAt ?? "2026-03-06 10:00:00",
  };
}

describe("filterDocumentsByQuery", () => {
  it("returns full list when query is empty", () => {
    const docs = [
      createDocument({ id: "1", name: "a.txt" }),
      createDocument({ id: "2", name: "b.txt" }),
    ];
    expect(filterDocumentsByQuery(docs, "")).toEqual(docs);
    expect(filterDocumentsByQuery(docs, "   ")).toEqual(docs);
  });

  it("filters by name (case insensitive)", () => {
    const docs = [
      createDocument({ id: "1", name: "Readme.md" }),
      createDocument({ id: "2", name: "notes.txt" }),
      createDocument({ id: "3", name: "README-extra.md" }),
    ];
    expect(filterDocumentsByQuery(docs, "readme")).toEqual([docs[0], docs[2]]);
    expect(filterDocumentsByQuery(docs, "README")).toEqual([docs[0], docs[2]]);
    expect(filterDocumentsByQuery(docs, "notes")).toEqual([docs[1]]);
  });

  it("filters by title (case insensitive)", () => {
    const docs = [
      createDocument({ id: "1", name: "a.txt", title: "Project Guide" }),
      createDocument({ id: "2", name: "b.txt", title: "Quick Start" }),
    ];
    expect(filterDocumentsByQuery(docs, "guide")).toEqual([docs[0]]);
    expect(filterDocumentsByQuery(docs, "QUICK")).toEqual([docs[1]]);
  });

  it("matches if either name or title contains query", () => {
    const docs = [
      createDocument({ id: "1", name: "foo.txt", title: "Bar" }),
      createDocument({ id: "2", name: "bar.txt", title: "Other" }),
    ];
    expect(filterDocumentsByQuery(docs, "foo")).toEqual([docs[0]]);
    expect(filterDocumentsByQuery(docs, "bar")).toEqual([docs[0], docs[1]]);
  });

  it("returns empty array when no document matches", () => {
    const docs = [
      createDocument({ id: "1", name: "a.txt" }),
      createDocument({ id: "2", name: "b.txt" }),
    ];
    expect(filterDocumentsByQuery(docs, "xyz")).toEqual([]);
  });
});
