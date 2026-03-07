import { ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
import { useState } from "react";
import { MarkdownContent } from "./markdown-content";

type ThinkBlockProps = {
  thinkContent: string;
  defaultExpanded?: boolean;
};

/**
 * 可折叠的「思考」内容块。
 * 默认折叠，点击展开后显示 <think> 内的内容。
 */
export function ThinkBlock({
  thinkContent,
  defaultExpanded = false,
}: ThinkBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/80">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted"
      >
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
        <span>已经完成思考</span>
        {expanded ? (
          <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border px-3 py-2">
          <MarkdownContent
            content={thinkContent}
            className="text-muted-foreground [&_p]:mb-1 [&_p:last-child]:mb-0"
          />
        </div>
      )}
    </div>
  );
}
