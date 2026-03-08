import type { ChatMessage, DocumentItem } from "./document";

export type ChatSessionId = string;

export type ChatSession = {
  id: ChatSessionId;
  title: string;
  messages: ChatMessage[];
  loadedDocuments: DocumentItem[];
  pendingDocuments: DocumentItem[];
  currentModelConfigId?: string;
  currentProvider: string;
  currentModelName: string;
  createdAt: string;
  updatedAt: string;
};

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

export type StreamDoneMeta = {
  sessionId?: string;
  createdAt?: string;
  references?: string[];
  modelConfigId?: string;
  provider?: string;
  modelName?: string;
};

export type SendChatMessageStreamCallbacks = {
  onChunk: (content: string) => void;
  onDone: (meta: StreamDoneMeta) => void;
  onError: (error: Error) => void;
};

export type StreamingAssistantMessage = {
  id: string;
  content: string;
};
