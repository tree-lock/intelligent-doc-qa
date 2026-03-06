import { Suspense } from "react";
import { useAppRouteContext } from "../app/route-context";
import { LoadingPanel } from "../components/ui/loading-panel";
import { useDocumentsQuery } from "../hooks/use-documents-query";
import { DocumentsPage } from "./documents-page";

function DocumentsRoutePageContent() {
  const { onStartChat } = useAppRouteContext();
  const { data: documents } = useDocumentsQuery();

  return (
    <DocumentsPage initialDocuments={documents} onStartChat={onStartChat} />
  );
}

export function DocumentsRoutePage() {
  return (
    <Suspense
      fallback={
        <LoadingPanel title="文档加载中" description="正在读取文档列表..." />
      }
    >
      <DocumentsRoutePageContent />
    </Suspense>
  );
}
