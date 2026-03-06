export const APP_ROUTE_PATH = {
  documents: "/",
  chat: "/chat",
  settings: "/settings",
} as const;

export function getChatRoutePath(chatId: string) {
  return `${APP_ROUTE_PATH.chat}/${chatId}`;
}
