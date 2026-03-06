import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTE_PATH, getChatRoutePath } from "../app/route-config";
import { type ChatMessage, type DocumentItem } from "../types";
import { useSendChatMessageMutation } from "./use-send-chat-message-mutation";
import {
  NEW_CHAT_ID,
  createChatId,
  createSessionTitle,
  sortSessionsByUpdatedAtDesc,
  type ChatSession,
} from "../lib/chat-sessions";
import {
  resolveCurrentChatId,
  shouldRedirectInvalidChatRoute,
} from "../lib/chat-route";

export function useAppChatState(
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const { mutateAsync: sendChatMessage, isPending: isSendingMessage } =
    useSendChatMessageMutation();
  const [draftPendingDocuments, setDraftPendingDocuments] = useState<
    DocumentItem[]
  >([]);

  const currentChatId = useMemo(
    () => resolveCurrentChatId(location.pathname, sessions),
    [location.pathname, sessions],
  );

  useEffect(() => {
    if (shouldRedirectInvalidChatRoute(location.pathname, sessions)) {
      navigate(APP_ROUTE_PATH.chat, { replace: true });
    }
  }, [location.pathname, navigate, sessions]);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === currentChatId),
    [currentChatId, sessions],
  );

  const onStartChat = useCallback(
    (selectedDocs: DocumentItem[]) => {
      setDraftPendingDocuments(selectedDocs);
      navigate(APP_ROUTE_PATH.chat);
    },
    [navigate],
  );

  const onOpenRecentChat = useCallback(
    (chatId: string) => {
      navigate(getChatRoutePath(chatId));
    },
    [navigate],
  );

  const onSendMessage = useCallback(
    async (content: string) => {
      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "user",
        content,
      };

      const currentDocuments =
        currentChatId === NEW_CHAT_ID
          ? draftPendingDocuments
          : (() => {
              if (!currentSession) {
                return [] as DocumentItem[];
              }

              const documentMap = new Map<string, DocumentItem>();
              for (const document of currentSession.loadedDocuments) {
                documentMap.set(document.id, document);
              }
              for (const document of currentSession.pendingDocuments) {
                if (!documentMap.has(document.id)) {
                  documentMap.set(document.id, document);
                }
              }
              return Array.from(documentMap.values());
            })();

      const assistantReply = await sendChatMessage({
        message: content,
        documents: currentDocuments,
      });

      const assistantMessage: ChatMessage = {
        id: `m-${Date.now()}-assistant`,
        role: "assistant",
        content: assistantReply.content,
      };

      if (currentChatId === NEW_CHAT_ID) {
        const newChatId = createChatId();
        const newSession: ChatSession = {
          id: newChatId,
          title: createSessionTitle(content),
          messages: [userMessage, assistantMessage],
          loadedDocuments: draftPendingDocuments,
          pendingDocuments: [],
          createdAt: now,
          updatedAt: now,
        };

        setSessions((prev) =>
          sortSessionsByUpdatedAtDesc([newSession, ...prev]),
        );
        navigate(getChatRoutePath(newChatId));
        return;
      }

      setSessions((prev) =>
        sortSessionsByUpdatedAtDesc(
          prev.map((session) => {
            if (session.id !== currentChatId) {
              return session;
            }
            return {
              ...session,
              loadedDocuments: [
                ...session.loadedDocuments,
                ...session.pendingDocuments.filter(
                  (pendingDocument) =>
                    !session.loadedDocuments.some(
                      (loadedDocument) =>
                        loadedDocument.id === pendingDocument.id,
                    ),
                ),
              ],
              pendingDocuments: [],
              messages: [...session.messages, userMessage, assistantMessage],
              updatedAt: now,
            };
          }),
        ),
      );
    },
    [
      currentChatId,
      currentSession,
      draftPendingDocuments,
      navigate,
      sendChatMessage,
      setSessions,
    ],
  );

  const onPendingDocumentsChange = useCallback(
    (nextDocuments: DocumentItem[]) => {
      if (currentChatId === NEW_CHAT_ID) {
        setDraftPendingDocuments(nextDocuments);
        return;
      }

      const now = new Date().toISOString();
      setSessions((prev) =>
        sortSessionsByUpdatedAtDesc(
          prev.map((session) => {
            if (session.id !== currentChatId) {
              return session;
            }
            return {
              ...session,
              pendingDocuments: nextDocuments,
              updatedAt: now,
            };
          }),
        ),
      );
    },
    [currentChatId, setSessions],
  );

  return {
    currentChatId,
    currentSession,
    draftPendingDocuments,
    onStartChat,
    onOpenRecentChat,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
  };
}
