import { useOutletContext } from "react-router-dom";
import { type ChatSession } from "../lib/chat-sessions";
import { type DocumentItem } from "../types";

export type AppRouteContextValue = {
  onStartChat: (selectedDocs: DocumentItem[]) => void;
  currentChatId: string;
  currentSession?: ChatSession;
  draftPendingDocuments: DocumentItem[];
  onSendMessage: (content: string) => Promise<void>;
  isSendingMessage: boolean;
  onPendingDocumentsChange: (nextDocuments: DocumentItem[]) => void;
};

export function useAppRouteContext() {
  return useOutletContext<AppRouteContextValue>();
}
