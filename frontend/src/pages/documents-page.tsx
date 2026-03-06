import { useMemo, useState } from "react";
import { Edit3, MessageCirclePlus, Trash2, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import { DocumentCard } from "../components/documents/document-card";
import { DocumentUploadZone } from "../components/documents/document-upload-zone";
import { useDocumentUpload } from "../hooks/use-document-upload";
import { type DocumentItem } from "../types";
import { cn } from "../lib/utils";

type DocumentsPageProps = {
  initialDocuments: DocumentItem[];
  onStartChat?: (selectedDocs: DocumentItem[]) => void;
};

export function DocumentsPage({
  initialDocuments,
  onStartChat,
}: DocumentsPageProps) {
  const {
    isUploading,
    isDeleting,
    isDragging,
    fileInputRef,
    onInputFilesChange,
    onDropFiles,
    onDragOver,
    onDragLeave,
    deleteByIds,
  } = useDocumentUpload();
  const documents = initialDocuments;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const selectedDocuments = documents.filter((doc) =>
    selectedIdSet.has(doc.id),
  );

  const startNewChat = () => {
    if (selectedDocuments.length === 0) {
      return;
    }
    onStartChat?.(selectedDocuments);
  };

  const deleteSelectedDocuments = () => {
    if (selectedDocuments.length === 0) {
      return;
    }
    deleteByIds(selectedDocuments.map((document) => document.id));
    setSelectedIds([]);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          把文档变成可执行的
          <span className="text-blue-600"> Prompt</span>
        </h1>
        <p className="text-sm text-slate-600">
          上传 TXT / Markdown
          文档，勾选后在对话开始并发送消息时加载用于问答检索。
        </p>
      </header>

      <section
        onDrop={onDropFiles}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "rounded-2xl border bg-white p-4 shadow-sm transition",
          isDragging
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-slate-200",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-slate-800">文档列表</h2>
            <p className="text-xs text-slate-500">{documents.length} 个文档</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isEditMode ? "secondary" : "outline"}
              onClick={() => setIsEditMode((prev) => !prev)}
              className="inline-flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {isEditMode ? "退出编辑" : "编辑"}
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "上传中..." : "上传文档"}
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <DocumentUploadZone
            fileInputRef={fileInputRef}
            onInputFilesChange={onInputFilesChange}
            isDragging={isDragging}
          />
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            还没有文档，点击右上角"上传文档"或直接拖拽文件到此区域。
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isChecked={selectedIdSet.has(doc.id)}
                onToggle={toggleSelected}
                showCheckbox
              />
            ))}
          </ul>
        )}

        {selectedDocuments.length > 0 ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs text-slate-600">
              已选择 {selectedDocuments.length} 个文档
            </span>
            {isEditMode ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteSelectedDocuments}
                className="inline-flex items-center gap-2"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "删除中..." : "删除文档"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={startNewChat}
                className="inline-flex items-center gap-2"
              >
                <MessageCirclePlus className="h-4 w-4" />
                开启新对话（发送消息后加载）
              </Button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
