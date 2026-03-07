import { Bot, FileText, MoonStar, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
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
  const { setTheme, resolvedTheme } = useTheme();
  const activePage: MenuPage =
    location.pathname === APP_ROUTE_PATH.chat ||
    location.pathname.startsWith(`${APP_ROUTE_PATH.chat}/`)
      ? "chat"
      : location.pathname === APP_ROUTE_PATH.settings
        ? "settings"
        : "documents";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-border bg-card p-4">
          <div className="mb-6 flex items-center justify-between text-sm text-foreground">
            <span className="font-medium">智能问答</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <Sun className="h-4 w-4 dark:block hidden" />
              <MoonStar className="h-4 w-4 dark:hidden" />
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
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          <div className="mt-8">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              最近
            </div>
            {recentSessions.length === 0 ? (
              <div className="rounded-md px-3 py-2 text-xs text-muted-foreground">
                暂无历史会话
              </div>
            ) : (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {recentSessions.slice(0, 8).map((session) => (
                  <li key={session.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenRecentChat(session.id)}
                      className={cn(
                        "h-auto w-full justify-start rounded-md px-3 py-2 text-left text-sm",
                        currentChatId === session.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background px-6 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
