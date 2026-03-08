import { useAppRouteContext } from "../app/route-context";
import type { ChatMessage } from "../types";
import { ChatPage } from "./chat-page";

function ChatRoutePage() {
  const {
    currentChatId,
    currentSession,
    optimisticUserMessage,
    streamingAssistantMessage,
    draftPendingDocuments,
    draftModelConfigId,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
    onModelConfigChange,
  } = useAppRouteContext();

  const messages: ChatMessage[] = [
    ...(currentSession?.messages ?? []),
    ...(optimisticUserMessage ? [optimisticUserMessage] : []),
    ...(streamingAssistantMessage
      ? [
          {
            id: streamingAssistantMessage.id,
            role: "assistant" as const,
            content: streamingAssistantMessage.content,
          },
        ]
      : []),
  ];

  return (
    <ChatPage
      chatId={currentChatId}
      messages={messages}
      loadedDocuments={currentSession?.loadedDocuments ?? []}
      pendingDocuments={
        currentSession?.pendingDocuments ?? draftPendingDocuments
      }
      currentModelConfigId={
        currentSession?.currentModelConfigId ?? draftModelConfigId
      }
      onSendMessage={onSendMessage}
      isSendingMessage={isSendingMessage}
      onPendingDocumentsChange={onPendingDocumentsChange}
      onModelConfigChange={onModelConfigChange}
    />
  );
}

export { ChatRoutePage };
export default ChatRoutePage;
