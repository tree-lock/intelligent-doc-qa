import { useOutletContext } from "react-router-dom";
import type { StreamingAssistantMessage } from "../hooks/use-app-chat-state";
import type { ChatSession } from "../lib/chat-sessions";
import type { ChatMessage, DocumentItem } from "../types";

export type AppRouteContextValue = {
  onStartChat: (selectedDocs: DocumentItem[]) => void;
  currentChatId: string;
  currentSession?: ChatSession;
  optimisticUserMessage: ChatMessage | null;
  streamingAssistantMessage: StreamingAssistantMessage | null;
  draftPendingDocuments: DocumentItem[];
  draftModelConfigId?: string;
  onSendMessage: (content: string) => Promise<void>;
  isSendingMessage: boolean;
  onPendingDocumentsChange: (nextDocuments: DocumentItem[]) => void;
  onModelConfigChange: (nextModelConfigId: string) => void;
};

export function useAppRouteContext() {
  return useOutletContext<AppRouteContextValue>();
}
