import { APP_ROUTE_PATH } from "../app/route-config";
import { type ChatSession, NEW_CHAT_ID } from "./chat-sessions";

export function resolveCurrentChatId(
  pathname: string,
  sessions: ChatSession[],
) {
  if (pathname === APP_ROUTE_PATH.chat) {
    return NEW_CHAT_ID;
  }

  const chatPrefix = `${APP_ROUTE_PATH.chat}/`;
  if (!pathname.startsWith(chatPrefix)) {
    return NEW_CHAT_ID;
  }

  const routeChatId = pathname.slice(chatPrefix.length);
  if (!routeChatId) {
    return NEW_CHAT_ID;
  }

  const hasSession = sessions.some((session) => session.id === routeChatId);
  return hasSession ? routeChatId : NEW_CHAT_ID;
}

export function shouldRedirectInvalidChatRoute(
  pathname: string,
  sessions: ChatSession[],
) {
  const chatPrefix = `${APP_ROUTE_PATH.chat}/`;
  if (!pathname.startsWith(chatPrefix)) {
    return false;
  }

  const routeChatId = pathname.slice(chatPrefix.length);
  if (!routeChatId) {
    return true;
  }

  return !sessions.some((session) => session.id === routeChatId);
}
