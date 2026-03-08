import { statusClass, statusText } from "../../lib/document-status";
import { cn } from "../../lib/utils";
import type { DocumentItem } from "../../types";

type DocumentCardProps = {
  doc: DocumentItem;
  isChecked: boolean;
  onToggle: (id: string, checked: boolean) => void;
  showCheckbox?: boolean;
};

export function DocumentCard({
  doc,
  isChecked,
  onToggle,
  showCheckbox = true,
}: DocumentCardProps) {
  return (
    <li
      className={cn(
        "relative rounded-xl border bg-muted/70 px-4 py-3 transition",
        isChecked
          ? "border-primary/50 bg-primary/10 shadow-sm"
          : "border-border hover:border-border",
      )}
    >
      {showCheckbox ? (
        <label className="absolute top-3 right-3 inline-flex items-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => onToggle(doc.id, event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
          />
        </label>
      ) : null}

      <div className={showCheckbox ? "pr-8" : ""}>
        <div className="truncate text-sm font-medium text-foreground">
          {doc.name}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {(doc.sourceFormat ?? doc.type).toUpperCase()} · 更新于{" "}
          {doc.updatedAt}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-xs",
            statusClass[doc.status],
          )}
        >
          {statusText[doc.status]}
        </span>
      </div>
    </li>
  );
}
