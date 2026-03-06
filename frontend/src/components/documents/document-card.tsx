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
        "relative rounded-xl border bg-slate-50/70 px-4 py-3 transition",
        isChecked
          ? "border-blue-300 bg-blue-50/70 shadow-sm"
          : "border-slate-200 hover:border-slate-300",
      )}
    >
      {showCheckbox ? (
        <label className="absolute top-3 right-3 inline-flex items-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => onToggle(doc.id, event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      ) : null}

      <div className={showCheckbox ? "pr-8" : ""}>
        <div className="truncate text-sm font-medium text-slate-800">
          {doc.name}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {doc.type.toUpperCase()} · 更新于 {doc.updatedAt}
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
