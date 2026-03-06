import { FilePen } from "lucide-react";
import { Button } from "../ui/button";
import { AddDocumentDialog } from "./add-document-dialog";
import { type DocumentItem } from "../../types";
import { cn } from "../../lib/utils";

type DocumentSidebarProps = {
  chatId: string;
  loadedDocuments: DocumentItem[];
  allDocuments: DocumentItem[];
  loadedDocumentIdSet: Set<string>;
  selectedDocuments: DocumentItem[];
  selectedDocumentIds: string[];
  selectedCount: number;
  isAddDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  onSave: () => void;
  setSelectedDocumentIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
};

const NEW_CHAT_ID = "new";

export function DocumentSidebar({
  chatId,
  loadedDocuments,
  allDocuments,
  loadedDocumentIdSet,
  selectedDocuments,
  selectedDocumentIds,
  selectedCount,
  isAddDialogOpen,
  onDialogOpenChange,
  onToggle,
  onSave,
  setSelectedDocumentIds,
}: DocumentSidebarProps) {
  const isNewChat = chatId === NEW_CHAT_ID;

  const handleDialogOpenChange = (open: boolean) => {
    onDialogOpenChange(open);
    if (open) {
      setSelectedDocumentIds(selectedDocuments.map((d) => d.id));
    }
  };

  return (
    <section className="col-span-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-sm font-medium text-slate-800">对话文档</h2>
        <AddDocumentDialog
          open={isAddDialogOpen}
          onOpenChange={handleDialogOpenChange}
          documents={allDocuments}
          loadedDocumentIdSet={loadedDocumentIdSet}
          selectedDocumentIds={selectedDocumentIds}
          onToggle={onToggle}
          onSave={onSave}
          loadedCount={loadedDocuments.length}
          isNewChat={isNewChat}
          trigger={
            <Button
              type="button"
              onClick={() => handleDialogOpenChange(true)}
              size="sm"
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs text-white transition hover:bg-blue-500"
            >
              <FilePen className="h-3.5 w-3.5" />
              修改文档
            </Button>
          }
        />
      </div>

      {selectedCount === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-6 text-center text-xs text-slate-500">
          当前对话暂无文档，请点击"修改文档"。
        </div>
      ) : (
        <div className="space-y-1">
          {selectedDocuments.map((document) => {
            const isLoaded = loadedDocumentIdSet.has(document.id);
            return (
              <div
                key={document.id}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  isLoaded
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 truncate text-sm text-slate-800">
                    {document.name}
                  </div>
                  {isLoaded ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                      已加载
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {document.type.toUpperCase()} · {document.updatedAt}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
