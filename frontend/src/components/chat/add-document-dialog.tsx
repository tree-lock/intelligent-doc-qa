import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { filterDocumentsByQuery } from "../../lib/document-filter";
import { cn } from "../../lib/utils";
import type { DocumentItem } from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

type AddDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentItem[];
  loadedDocumentIdSet: Set<string>;
  selectedDocumentIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  onSave: () => void;
  loadedCount: number;
  isNewChat: boolean;
  trigger?: ReactNode;
};

export function AddDocumentDialog({
  open,
  onOpenChange,
  documents,
  loadedDocumentIdSet,
  selectedDocumentIds,
  onToggle,
  onSave,
  loadedCount,
  isNewChat,
  trigger,
}: AddDocumentDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredDocuments = useMemo(
    () => filterDocumentsByQuery(documents, searchQuery),
    [documents, searchQuery],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearchQuery("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>添加已有文档到当前对话</DialogTitle>
          <DialogDescription>
            {isNewChat
              ? "勾选后文档会在发送首条消息时加载；生效前可随时取消。"
              : "新增文档会在下一轮对话开始时加载；已加载文档不可移除。"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="按名称或标题搜索"
            className="pl-9"
            aria-label="按名称或标题搜索文档"
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {documents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无文档，请先在文档管理页上传。
            </p>
          ) : filteredDocuments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              未找到匹配的文档
            </p>
          ) : (
            filteredDocuments.map((document) => {
              const isLoaded = loadedDocumentIdSet.has(document.id);
              const isSelected = selectedDocumentIds.includes(document.id);
              return (
                <label
                  key={document.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2",
                    isLoaded
                      ? "border-primary/30 bg-primary/10"
                      : "border-border bg-card",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isLoaded}
                    onChange={(event) =>
                      onToggle(document.id, event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-foreground">
                        {document.name}
                      </span>
                      {isLoaded ? (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                          已加载
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {document.type.toUpperCase()} · {document.updatedAt}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="text-xs text-muted-foreground">
            已选择 {selectedDocumentIds.length} 个文档（已加载 {loadedCount}
            ，待生效 {Math.max(selectedDocumentIds.length - loadedCount, 0)}）
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="button" onClick={onSave}>
              保存文档选择
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
