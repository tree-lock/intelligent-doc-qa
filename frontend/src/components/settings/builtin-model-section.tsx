import { BUILTIN_MODELS, type BuiltinModelId } from "../../lib/system-settings";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type BuiltinModelSectionProps = {
  selectedModel: BuiltinModelId;
  onSelect: (value: BuiltinModelId) => void;
};

export function BuiltinModelSection({
  selectedModel,
  onSelect,
}: BuiltinModelSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-slate-800">内置模型</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {BUILTIN_MODELS.map((item) => (
          <Button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            variant="outline"
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition",
              selectedModel === item.id
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
