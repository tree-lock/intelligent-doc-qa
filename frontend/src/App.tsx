import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import type { AppRouteContextValue } from "./app/route-context";
import { getPageTitle } from "./config/page-titles";
import { AppShell } from "./components/layout/app-shell";
import { useAppChatState } from "./hooks/use-app-chat-state";
import { useChatSessions } from "./hooks/use-chat-sessions";

function App() {
  const { pathname } = useLocation();
  const { sessions, setSessions } = useChatSessions();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);
  const {
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
  } = useAppChatState(sessions, setSessions);

  const routeContext = useMemo<AppRouteContextValue>(
    () => ({
      onStartChat,
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
    }),
    [
      onStartChat,
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
