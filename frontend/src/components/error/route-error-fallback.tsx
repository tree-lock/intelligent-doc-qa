import { AlertCircle } from "lucide-react";
import { useNavigate, useRouteError } from "react-router-dom";
import { APP_ROUTE_PATH } from "../../app/route-config";
import { getErrorMessage } from "../../utils/error";
import { Button } from "../ui/button";

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
