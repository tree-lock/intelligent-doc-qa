import { type ReactNode } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { type DocumentItem } from "../../types";
import { cn } from "../../lib/utils";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {documents.map((document) => {
            const isLoaded = loadedDocumentIdSet.has(document.id);
            const isSelected = selectedDocumentIds.includes(document.id);
            return (
              <label
                key={document.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2",
                  isLoaded
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-slate-200 bg-white",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isLoaded}
                  onChange={(event) =>
                    onToggle(document.id, event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-slate-800">
                      {document.name}
                    </span>
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
              </label>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="text-xs text-slate-500">
            已选择 {selectedDocumentIds.length} 个文档（已加载 {loadedCount}
            ，待生效 {Math.max(selectedDocumentIds.length - loadedCount, 0)}）
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
