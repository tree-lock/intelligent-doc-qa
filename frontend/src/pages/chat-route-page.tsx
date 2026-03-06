import { useAppRouteContext } from "../app/route-context";
import { ChatPage } from "./chat-page";

export function ChatRoutePage() {
  const {
    currentChatId,
    currentSession,
    draftPendingDocuments,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
  } = useAppRouteContext();

  return (
    <ChatPage
      chatId={currentChatId}
      messages={currentSession?.messages ?? []}
      loadedDocuments={currentSession?.loadedDocuments ?? []}
      pendingDocuments={
        currentSession?.pendingDocuments ?? draftPendingDocuments
      }
      onSendMessage={onSendMessage}
      isSendingMessage={isSendingMessage}
      onPendingDocumentsChange={onPendingDocumentsChange}
    />
  );
}
