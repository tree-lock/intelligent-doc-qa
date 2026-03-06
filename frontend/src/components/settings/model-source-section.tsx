import type { ModelSource } from "../../lib/system-settings";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const MODEL_SOURCES: Array<{ key: ModelSource; label: string }> = [
  { key: "builtin", label: "系统内置模型" },
  { key: "custom", label: "自定义模型" },
] as const;

type ModelSourceSectionProps = {
  selectedModelType: ModelSource;
  onSelect: (value: ModelSource) => void;
};

export function ModelSourceSection({
  selectedModelType,
  onSelect,
}: ModelSourceSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-slate-800">模型来源</h2>
      <div className="grid grid-cols-2 gap-2">
        {MODEL_SOURCES.map((item) => (
          <Button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            variant="outline"
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              selectedModelType === item.key
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
            )}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
