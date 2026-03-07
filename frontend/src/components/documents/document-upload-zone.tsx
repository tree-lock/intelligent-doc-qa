import type { ChangeEvent, RefObject } from "react";
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
          "rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground transition",
          isDragging && "border-primary bg-primary/10",
        )}
      >
        拖拽文件到文档列表任意区域即可上传（支持 TXT / Markdown）
      </div>
    </>
  );
}
