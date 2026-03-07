import { useAppRouteContext } from "../app/route-context";
import { ChatPage } from "./chat-page";

export function ChatRoutePage() {
  const {
    currentChatId,
    currentSession,
    draftPendingDocuments,
    draftModelConfigId,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
    onModelConfigChange,
  } = useAppRouteContext();

  return (
    <ChatPage
      chatId={currentChatId}
      messages={currentSession?.messages ?? []}
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
