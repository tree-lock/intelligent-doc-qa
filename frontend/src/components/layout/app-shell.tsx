import { Bot, FileText, MoonStar, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTE_PATH } from "../../app/route-config";
import type { ChatSession } from "../../lib/chat-sessions";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type AppShellProps = {
  recentSessions: ChatSession[];
  currentChatId: string;
  onOpenRecentChat: (chatId: string) => void;
  children: ReactNode;
};

type MenuPage = "documents" | "chat" | "settings";

const menuItems: Array<{
  key: MenuPage;
  path: string;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: "documents",
    path: APP_ROUTE_PATH.documents,
    label: "文档管理",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: "chat",
    path: APP_ROUTE_PATH.chat,
    label: "Agent 问答",
    icon: <Bot className="h-4 w-4" />,
  },
  {
    key: "settings",
    path: APP_ROUTE_PATH.settings,
    label: "系统配置",
    icon: <Settings className="h-4 w-4" />,
  },
];

export function AppShell({
  recentSessions,
  currentChatId,
  onOpenRecentChat,
  children,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage: MenuPage =
    location.pathname === APP_ROUTE_PATH.chat ||
    location.pathname.startsWith(`${APP_ROUTE_PATH.chat}/`)
      ? "chat"
      : location.pathname === APP_ROUTE_PATH.settings
        ? "settings"
        : "documents";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 bg-white p-4">
          <div className="mb-6 flex items-center justify-between text-sm text-slate-700">
            <span className="font-medium">智能问答</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <MoonStar className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                variant="ghost"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                  activePage === item.key
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          <div className="mt-8">
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              最近
            </div>
            {recentSessions.length === 0 ? (
              <div className="rounded-md px-3 py-2 text-xs text-slate-400">
                暂无历史会话
              </div>
            ) : (
              <ul className="space-y-1 text-sm text-slate-600">
                {recentSessions.slice(0, 8).map((session) => (
                  <li key={session.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenRecentChat(session.id)}
                      className={cn(
                        "h-auto w-full justify-start rounded-md px-3 py-2 text-left text-sm",
                        currentChatId === session.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <span className="block truncate">{session.title}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.12),transparent_45%),linear-gradient(to_bottom,#f8fafc,#eef2ff)] px-6 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
