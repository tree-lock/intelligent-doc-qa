import type { DocumentItem } from "../../types";
import { apiFetch } from "./client";

export async function fetchDocuments(): Promise<DocumentItem[]> {
  return apiFetch<DocumentItem[]>("/api/v1/documents");
}

export async function uploadDocuments(files: File[]): Promise<DocumentItem[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  return apiFetch<DocumentItem[]>("/api/v1/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await apiFetch<void>("/api/v1/documents", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
}
