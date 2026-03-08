import type { LLMConfig } from "../../lib/system-settings";
import { Button } from "../ui/button";

export type ConfigListSidebarProps = {
  configs: LLMConfig[];
  selectedConfigId: string | null;
  onSelectConfig: (configId: string) => void;
  onCreateNew: () => void;
};

export function ConfigListSidebar({
  configs,
  selectedConfigId,
  onSelectConfig,
  onCreateNew,
}: ConfigListSidebarProps) {
  return (
    <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">模型配置</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            不再提供内置模型，所有模型都需要手动配置。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onCreateNew}
          className="rounded-lg border-border px-3 py-2 text-xs"
        >
          新建
        </Button>
      </div>

      <div className="space-y-2">
        {configs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            暂无模型配置，先创建一个。
          </div>
        ) : (
          configs.map((config) => (
            <button
              key={config.id}
              type="button"
              onClick={() => onSelectConfig(config.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                selectedConfigId === config.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {config.name}
                </span>
                {config.isDefault ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    默认
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {config.provider} / {config.modelName}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
