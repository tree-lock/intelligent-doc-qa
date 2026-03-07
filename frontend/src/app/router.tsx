import type { ComponentType } from "react";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import App from "../App";
import { RouteErrorFallback } from "../components/error/route-error-fallback";
import { LoadingPanel } from "../components/ui/loading-panel";
import { APP_ROUTE_PATH } from "./route-config";

const lazyPage = (fn: () => Promise<{ default: ComponentType }>) => lazy(fn);

const ChatRoutePage = lazyPage(() => import("../pages/chat-route-page"));
const DocumentsRoutePage = lazyPage(
  () => import("../pages/documents-route-page"),
);
const SettingsRoutePage = lazyPage(
  () => import("../pages/settings-route-page"),
);

const routeErrorElement = <RouteErrorFallback />;
const pageFallback = (
  <LoadingPanel title="页面加载中" description="请稍候..." />
);

const appRouter = createBrowserRouter([
  {
    path: APP_ROUTE_PATH.documents,
    element: <App />,
    errorElement: routeErrorElement,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={pageFallback}>
            <DocumentsRoutePage />
          </Suspense>
        ),
        errorElement: routeErrorElement,
      },
      {
        path: APP_ROUTE_PATH.chat.slice(1),
        element: (
          <Suspense fallback={pageFallback}>
            <ChatRoutePage />
          </Suspense>
        ),
        errorElement: routeErrorElement,
      },
      {
        path: `${APP_ROUTE_PATH.chat.slice(1)}/:id`,
        element: (
          <Suspense fallback={pageFallback}>
            <ChatRoutePage />
          </Suspense>
        ),
        errorElement: routeErrorElement,
      },
      {
        path: APP_ROUTE_PATH.settings.slice(1),
        element: (
          <Suspense fallback={pageFallback}>
            <SettingsRoutePage />
          </Suspense>
        ),
        errorElement: routeErrorElement,
      },
      {
        path: "*",
        element: <Navigate to={APP_ROUTE_PATH.documents} replace />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={appRouter} />;
}
