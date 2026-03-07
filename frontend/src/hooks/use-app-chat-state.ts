import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTE_PATH, getChatRoutePath } from "../app/route-config";
import {
  resolveCurrentChatId,
  shouldRedirectInvalidChatRoute,
} from "../lib/chat-route";
import {
  type ChatSession,
  createChatId,
  createSessionTitle,
  NEW_CHAT_ID,
  sortSessionsByUpdatedAtDesc,
} from "../lib/chat-sessions";
import type { ChatMessage, DocumentItem } from "../types";
import { useLLMConfigsQuery } from "./use-llm-configs-query";
import { useSendChatMessageMutation } from "./use-send-chat-message-mutation";

export function useAppChatState(
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const { mutateAsync: sendChatMessage, isPending: isSendingMessage } =
    useSendChatMessageMutation();
  const { data: llmConfigs = [] } = useLLMConfigsQuery();
  const [draftPendingDocuments, setDraftPendingDocuments] = useState<
    DocumentItem[]
  >([]);
  const [optimisticUserMessage, setOptimisticUserMessage] =
    useState<ChatMessage | null>(null);
  const [draftModelConfigId, setDraftModelConfigId] = useState<
    string | undefined
  >();

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

  useEffect(() => {
    if (draftModelConfigId || llmConfigs.length === 0) {
      return;
    }
    const defaultConfig =
      llmConfigs.find((item) => item.isDefault) ?? llmConfigs[0];
    setDraftModelConfigId(defaultConfig?.id);
  }, [draftModelConfigId, llmConfigs]);

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
      const selectedModel =
        currentChatId === NEW_CHAT_ID
          ? llmConfigs.find((item) => item.id === draftModelConfigId)
          : llmConfigs.find(
              (item) => item.id === currentSession?.currentModelConfigId,
            );
      const userMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "user",
        content,
      };

      setOptimisticUserMessage(userMessage);

      try {
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
          sessionId: currentChatId !== NEW_CHAT_ID ? currentChatId : undefined,
          modelConfigId:
            currentChatId === NEW_CHAT_ID
              ? draftModelConfigId
              : currentSession?.currentModelConfigId,
        });

        const assistantMessage: ChatMessage = {
          id: `m-${Date.now()}-assistant`,
          role: "assistant",
          content: assistantReply.content,
        };

        if (currentChatId === NEW_CHAT_ID) {
          const newChatId = assistantReply.sessionId ?? createChatId();
          const newSession: ChatSession = {
            id: newChatId,
            title: createSessionTitle(content),
            messages: [userMessage, assistantMessage],
            loadedDocuments: draftPendingDocuments,
            pendingDocuments: [],
            currentModelConfigId:
              assistantReply.modelConfigId ?? selectedModel?.id,
            currentProvider:
              assistantReply.provider ?? selectedModel?.provider ?? "",
            currentModelName:
              assistantReply.modelName ?? selectedModel?.modelName ?? "",
            createdAt: now,
            updatedAt: now,
          };

          setSessions((prev) =>
            sortSessionsByUpdatedAtDesc([newSession, ...prev]),
          );
          navigate(getChatRoutePath(newChatId));
          return;
        }

        const targetSessionId = assistantReply.sessionId ?? currentChatId;
        setSessions((prev) =>
          sortSessionsByUpdatedAtDesc(
            prev.map((session) => {
              if (session.id !== targetSessionId) {
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
                currentModelConfigId:
                  assistantReply.modelConfigId ?? session.currentModelConfigId,
                currentProvider:
                  assistantReply.provider ?? session.currentProvider,
                currentModelName:
                  assistantReply.modelName ?? session.currentModelName,
                updatedAt: now,
              };
            }),
          ),
        );
      } finally {
        setOptimisticUserMessage(null);
      }
    },
    [
      currentChatId,
      currentSession,
      draftModelConfigId,
      draftPendingDocuments,
      llmConfigs,
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

  const onModelConfigChange = useCallback(
    (nextModelConfigId: string) => {
      if (currentChatId === NEW_CHAT_ID) {
        setDraftModelConfigId(nextModelConfigId);
        return;
      }
      const selectedConfig = llmConfigs.find(
        (item) => item.id === nextModelConfigId,
      );
      const now = new Date().toISOString();
      setSessions((previous) =>
        sortSessionsByUpdatedAtDesc(
          previous.map((session) => {
            if (session.id !== currentChatId) {
              return session;
            }
            return {
              ...session,
              currentModelConfigId: nextModelConfigId,
              currentProvider:
                selectedConfig?.provider ?? session.currentProvider,
              currentModelName:
                selectedConfig?.modelName ?? session.currentModelName,
              updatedAt: now,
            };
          }),
        ),
      );
    },
    [currentChatId, llmConfigs, setSessions],
  );

  return {
    currentChatId,
    currentSession,
    optimisticUserMessage,
    draftPendingDocuments,
    draftModelConfigId,
    onStartChat,
    onOpenRecentChat,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
    onModelConfigChange,
  };
}
