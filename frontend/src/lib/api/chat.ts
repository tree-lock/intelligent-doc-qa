import type { DocumentItem } from "../../types";
import { apiFetch } from "./client";

export type SendChatMessagePayload = {
  message: string;
  documents: DocumentItem[];
  sessionId?: string;
  modelConfigId?: string;
};

export type SendChatMessageResult = {
  content: string;
  sessionId?: string;
  createdAt?: string;
  references?: string[];
  modelConfigId?: string;
  provider?: string;
  modelName?: string;
};

export async function sendChatMessage(
  payload: SendChatMessagePayload,
): Promise<SendChatMessageResult> {
  return apiFetch<SendChatMessageResult>("/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
