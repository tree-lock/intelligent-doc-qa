import type { DocumentItem } from "../types";

export const DOCUMENTS_STORAGE_KEY = "doc-qa.documents.v1";

const isBrowser = typeof window !== "undefined";

function isValidType(value: unknown): value is DocumentItem["type"] {
  return value === "txt" || value === "markdown";
}

function isValidStatus(value: unknown): value is DocumentItem["status"] {
  return value === "ready" || value === "indexing" || value === "failed";
}

function normalizeDocument(input: unknown): DocumentItem | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const doc = input as Record<string, unknown>;
  if (
    typeof doc.id !== "string" ||
    typeof doc.name !== "string" ||
    typeof doc.updatedAt !== "string" ||
    !isValidType(doc.type) ||
    !isValidStatus(doc.status)
  ) {
    return null;
  }

  // Backward compatible with old records missing title/plainText.
  const title = typeof doc.title === "string" ? doc.title : doc.name;
  const plainText = typeof doc.plainText === "string" ? doc.plainText : "";

  return {
    id: doc.id,
    name: doc.name,
    title,
    plainText,
    type: doc.type,
    status: doc.status,
    updatedAt: doc.updatedAt,
  };
}

export function loadDocuments() {
  if (!isBrowser) {
    return [] as DocumentItem[];
  }

  try {
    const rawValue = window.localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!rawValue) {
      return [] as DocumentItem[];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [] as DocumentItem[];
    }

    return parsed
      .map((item) => normalizeDocument(item))
      .filter((item): item is DocumentItem => item !== null);
  } catch {
    return [] as DocumentItem[];
  }
}

export function saveDocuments(documents: DocumentItem[]) {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(
      DOCUMENTS_STORAGE_KEY,
      JSON.stringify(documents),
    );
  } catch {
    // Ignore persistence failures in UI mode.
  }
}

export function upsertDocuments(documents: DocumentItem[]) {
  if (documents.length === 0) {
    return loadDocuments();
  }

  const existing = loadDocuments();
  const map = new Map<string, DocumentItem>();

  for (const document of existing) {
    map.set(document.id, document);
  }
  for (const document of documents) {
    map.set(document.id, document);
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  saveDocuments(merged);
  return merged;
}

export function removeDocumentsByIds(ids: string[]) {
  if (ids.length === 0) {
    return loadDocuments();
  }

  const idSet = new Set(ids);
  const next = loadDocuments().filter((document) => !idSet.has(document.id));
  saveDocuments(next);
  return next;
}
