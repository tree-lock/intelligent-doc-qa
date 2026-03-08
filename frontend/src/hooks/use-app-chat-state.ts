import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { APP_ROUTE_PATH, getChatRoutePath } from "../app/route-config";
import { sendChatMessageStream } from "../lib/api/chat";
import {
  resolveCurrentChatId,
  shouldRedirectInvalidChatRoute,
} from "../lib/chat-route";
import {
  createChatId,
  createSessionTitle,
  NEW_CHAT_ID,
  sortSessionsByUpdatedAtDesc,
} from "../lib/chat-sessions";
import type {
  ChatMessage,
  ChatSession,
  DocumentItem,
  StreamDoneMeta,
  StreamingAssistantMessage,
} from "../types";
import { useLLMConfigsQuery } from "./use-llm-configs-query";

export type { StreamingAssistantMessage } from "../types";

export function useAppChatState(
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: llmConfigs = [] } = useLLMConfigsQuery();
  const [draftPendingDocuments, setDraftPendingDocuments] = useState<
    DocumentItem[]
  >([]);
  const [optimisticUserMessage, setOptimisticUserMessage] =
    useState<ChatMessage | null>(null);
  const [streamingAssistantMessage, setStreamingAssistantMessage] =
    useState<StreamingAssistantMessage | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
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

  const streamedContentRef = useRef("");
  const streamAbortRef = useRef<AbortController | null>(null);
  const isOnChatRouteRef = useRef(true);
  isOnChatRouteRef.current =
    location.pathname === APP_ROUTE_PATH.chat ||
    location.pathname.startsWith(`${APP_ROUTE_PATH.chat}/`);

  const onSendMessage = useCallback(
    async (content: string) => {
      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;

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
      streamedContentRef.current = "";
      setStreamingAssistantMessage({
        id: `m-${Date.now()}-stream`,
        content: "",
      });
      setIsSendingMessage(true);

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

      const finishStream = (assistantContent: string, meta: StreamDoneMeta) => {
        const assistantMessage: ChatMessage = {
          id: `m-${Date.now()}-assistant`,
          role: "assistant",
          content: assistantContent,
        };

        if (currentChatId === NEW_CHAT_ID) {
          const newChatId = meta.sessionId ?? createChatId();
          const newSession: ChatSession = {
            id: newChatId,
            title: createSessionTitle(content),
            messages: [userMessage, assistantMessage],
            loadedDocuments: draftPendingDocuments,
            pendingDocuments: [],
            currentModelConfigId: meta.modelConfigId ?? selectedModel?.id,
            currentProvider: meta.provider ?? selectedModel?.provider ?? "",
            currentModelName: meta.modelName ?? selectedModel?.modelName ?? "",
            createdAt: now,
            updatedAt: now,
          };
          setSessions((prev) =>
            sortSessionsByUpdatedAtDesc([newSession, ...prev]),
          );
          if (isOnChatRouteRef.current) {
            navigate(getChatRoutePath(newChatId));
          }
        } else {
          const targetSessionId = meta.sessionId ?? currentChatId;
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
                  messages: [
                    ...session.messages,
                    userMessage,
                    assistantMessage,
                  ],
                  currentModelConfigId:
                    meta.modelConfigId ?? session.currentModelConfigId,
                  currentProvider: meta.provider ?? session.currentProvider,
                  currentModelName: meta.modelName ?? session.currentModelName,
                  updatedAt: now,
                };
              }),
            ),
          );
        }
        setOptimisticUserMessage(null);
        setStreamingAssistantMessage(null);
        setIsSendingMessage(false);
      };

      try {
        await sendChatMessageStream(
          {
            message: content,
            documents: currentDocuments,
            sessionId:
              currentChatId !== NEW_CHAT_ID ? currentChatId : undefined,
            modelConfigId:
              currentChatId === NEW_CHAT_ID
                ? draftModelConfigId
                : currentSession?.currentModelConfigId,
          },
          {
            onChunk: (delta) => {
              streamedContentRef.current += delta;
              setStreamingAssistantMessage((prev) =>
                prev
                  ? { ...prev, content: prev.content + delta }
                  : { id: `m-${Date.now()}-stream`, content: delta },
              );
            },
            onDone: (meta) => {
              const fullContent = streamedContentRef.current;
              finishStream(fullContent, meta);
            },
            onError: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "发送消息失败，请稍后重试";
              toast.error(message, { duration: Infinity });
              setOptimisticUserMessage(null);
              setStreamingAssistantMessage(null);
              setIsSendingMessage(false);
            },
          },
          { signal: controller.signal },
        );
      } catch (err) {
        setOptimisticUserMessage(null);
        setStreamingAssistantMessage(null);
        setIsSendingMessage(false);
        const isAbort =
          err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          const message =
            err instanceof Error ? err.message : "发送消息失败，请稍后重试";
          toast.error(message, { duration: Infinity });
        }
      } finally {
        streamAbortRef.current = null;
      }
    },
    [
      currentChatId,
      currentSession,
      draftModelConfigId,
      draftPendingDocuments,
      llmConfigs,
      navigate,
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
    streamingAssistantMessage,
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
