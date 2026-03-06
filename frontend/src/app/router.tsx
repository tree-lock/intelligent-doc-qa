import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import App from "../App";
import { ChatRoutePage } from "../pages/chat-route-page";
import { DocumentsRoutePage } from "../pages/documents-route-page";
import { SettingsRoutePage } from "../pages/settings-route-page";
import { APP_ROUTE_PATH } from "./route-config";

const appRouter = createBrowserRouter([
  {
    path: APP_ROUTE_PATH.documents,
    element: <App />,
    children: [
      {
        index: true,
        element: <DocumentsRoutePage />,
      },
      {
        path: APP_ROUTE_PATH.chat.slice(1),
        element: <ChatRoutePage />,
      },
      {
        path: `${APP_ROUTE_PATH.chat.slice(1)}/:id`,
        element: <ChatRoutePage />,
      },
      {
        path: APP_ROUTE_PATH.settings.slice(1),
        element: <SettingsRoutePage />,
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
