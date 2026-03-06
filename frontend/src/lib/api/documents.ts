import type { DocumentItem } from "../../types";
import {
  loadDocuments,
  removeDocumentsByIds,
  upsertDocuments,
} from "../documents-storage";

const ACCEPTED_MIME_SET = new Set(["text/plain", "text/markdown"]);

function toDocumentType(file: File): DocumentItem["type"] | null {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".txt")) {
    return "txt";
  }
  if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown")) {
    return "markdown";
  }
  if (ACCEPTED_MIME_SET.has(file.type)) {
    return "txt";
  }
  return null;
}

function toDocumentId(fileName: string) {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
}

function toUpdatedAt() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function normalizePlainText(content: string) {
  return content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function readFileText(file: File) {
  const maybeFile = file as File & {
    text?: () => Promise<string>;
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (typeof maybeFile.text === "function") {
    return maybeFile.text();
  }
  if (typeof maybeFile.arrayBuffer === "function") {
    const buffer = await maybeFile.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }
  return new Promise<string>((resolve) => {
    if (typeof FileReader === "undefined") {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsText(file);
  });
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  return loadDocuments().map((document) => ({ ...document }));
}

export async function uploadDocuments(files: File[]): Promise<DocumentItem[]> {
  if (files.length === 0) {
    return [];
  }

  const existingDocuments = loadDocuments();
  const existingNames = new Set(
    existingDocuments.map((item) => item.name.toLowerCase()),
  );

  const nextDocuments = (
    await Promise.all(
      files.map(async (file) => {
        const type = toDocumentType(file);
        if (!type) {
          return null;
        }
        if (existingNames.has(file.name.toLowerCase())) {
          return null;
        }

        existingNames.add(file.name.toLowerCase());
        const plainText = normalizePlainText(await readFileText(file));
        const nextDocument: DocumentItem = {
          id: toDocumentId(file.name),
          name: file.name,
          title: file.name,
          plainText,
          type,
          status: "ready",
          updatedAt: toUpdatedAt(),
        };
        return nextDocument;
      }),
    )
  ).filter((item): item is DocumentItem => item !== null);

  if (nextDocuments.length === 0) {
    return [];
  }

  upsertDocuments(nextDocuments);
  return nextDocuments.map((document) => ({ ...document }));
}

export async function deleteDocuments(ids: string[]): Promise<void> {
  removeDocumentsByIds(ids);
}
