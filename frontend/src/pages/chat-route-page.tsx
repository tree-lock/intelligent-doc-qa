import { useAppRouteContext } from "../app/route-context";
import { ChatPage } from "./chat-page";

function ChatRoutePage() {
  const {
    currentChatId,
    currentSession,
    optimisticUserMessage,
    draftPendingDocuments,
    draftModelConfigId,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
    onModelConfigChange,
  } = useAppRouteContext();

  const messages = [
    ...(currentSession?.messages ?? []),
    ...(optimisticUserMessage ? [optimisticUserMessage] : []),
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
