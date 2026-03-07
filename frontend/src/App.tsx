import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import type { AppRouteContextValue } from "./app/route-context";
import { AppShell } from "./components/layout/app-shell";
import { useAppChatState } from "./hooks/use-app-chat-state";
import { useChatSessions } from "./hooks/use-chat-sessions";

function App() {
  const { sessions, setSessions } = useChatSessions();
  const {
    currentChatId,
    currentSession,
    draftPendingDocuments,
    draftModelConfigId,
    onStartChat,
    onOpenRecentChat,
    onSendMessage,
    isSendingMessage,
    onPendingDocumentsChange,
    onModelConfigChange,
  } = useAppChatState(sessions, setSessions);

  const routeContext = useMemo<AppRouteContextValue>(
    () => ({
      onStartChat,
      currentChatId,
      currentSession,
      draftPendingDocuments,
      draftModelConfigId,
      onSendMessage,
      isSendingMessage,
      onPendingDocumentsChange,
      onModelConfigChange,
    }),
    [
      onStartChat,
      currentChatId,
      currentSession,
      draftPendingDocuments,
      draftModelConfigId,
      onSendMessage,
      isSendingMessage,
      onPendingDocumentsChange,
      onModelConfigChange,
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
