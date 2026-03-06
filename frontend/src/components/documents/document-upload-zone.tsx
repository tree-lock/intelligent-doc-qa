import { type ChangeEvent, type RefObject } from "react";
import { cn } from "../../lib/utils";

type DocumentUploadZoneProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isDragging?: boolean;
};

export function DocumentUploadZone({
  fileInputRef,
  onInputFilesChange,
  isDragging = false,
}: DocumentUploadZoneProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.markdown,text/plain,text/markdown"
        className="hidden"
        onChange={onInputFilesChange}
      />
      <div
        className={cn(
          "rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 transition",
          isDragging && "border-blue-500 bg-blue-50/50",
        )}
      >
        拖拽文件到文档列表任意区域即可上传（支持 TXT / Markdown）
      </div>
    </>
  );
}
