import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { type AppRouteContextValue } from "./app/route-context";
import { AppShell } from "./components/layout/app-shell";
import { useChatSessions } from "./hooks/use-chat-sessions";
import { useAppChatState } from "./hooks/use-app-chat-state";

function App() {
  const { sessions, setSessions } = useChatSessions();
  const {
    currentChatId,
    currentSession,
    draftPendingDocuments,
    onStartChat,
    onOpenRecentChat,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
  } = useAppChatState(sessions, setSessions);

  const routeContext = useMemo<AppRouteContextValue>(
    () => ({
      onStartChat,
      currentChatId,
      currentSession,
      draftPendingDocuments,
      onSendMessage,
      isSendingMessage,
      onPendingDocumentsChange,
    }),
    [
      onStartChat,
      currentChatId,
      currentSession,
      draftPendingDocuments,
      onSendMessage,
      isSendingMessage,
      onPendingDocumentsChange,
    ],
  );

  return (
    <AppShell
      recentSessions={sessions}
      currentChatId={currentChatId}
      onOpenRecentChat={onOpenRecentChat}
    >
      <Outlet context={routeContext} />
    </AppShell>
  );
}

export default App;
