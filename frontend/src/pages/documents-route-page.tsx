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

function DocumentsRoutePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] min-w-0 flex-1 flex-col justify-center">
      <Suspense
        fallback={
          <LoadingPanel title="文档加载中" description="正在读取文档列表..." />
        }
      >
        <DocumentsRoutePageContent />
      </Suspense>
    </div>
  );
}

export { DocumentsRoutePage };
export default DocumentsRoutePage;
