import { AlertCircle } from "lucide-react";
import { useNavigate, useRouteError } from "react-router-dom";
import { APP_ROUTE_PATH } from "../../app/route-config";
import { Button } from "../ui/button";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "无法连接服务器，请检查网络或确认后端服务已启动。";
    }
    return error.message;
  }
  return "发生未知错误，请稍后重试。";
}

export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = getErrorMessage(error);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">页面加载失败</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="default"
          onClick={() => window.location.reload()}
          type="button"
        >
          重试
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(APP_ROUTE_PATH.documents)}
          type="button"
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}
