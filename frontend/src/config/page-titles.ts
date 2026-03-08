import { APP_ROUTE_PATH } from "./routes";

export const APP_TITLE = "AI智能文档问答";

/**
 * 根据 pathname 返回页面完整标题。
 * 主页为 APP_TITLE，子页为「页面名 ｜ APP_TITLE」。
 */
export function getPageTitle(pathname: string): string {
  if (pathname === APP_ROUTE_PATH.documents) {
    return APP_TITLE;
  }
  if (pathname === APP_ROUTE_PATH.settings) {
    return `系统配置 ｜ ${APP_TITLE}`;
  }
  if (
    pathname === APP_ROUTE_PATH.chat ||
    pathname.startsWith(`${APP_ROUTE_PATH.chat}/`)
  ) {
    return `Agent 问答 ｜ ${APP_TITLE}`;
  }
  return APP_TITLE;
}
