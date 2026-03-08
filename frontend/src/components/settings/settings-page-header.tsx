import { Button } from "../ui/button";

export type InputMode = "form" | "raw";

export type SettingsPageHeaderProps = {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
};

export function SettingsPageHeader({
  inputMode,
  onInputModeChange,
}: SettingsPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">系统配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          统一管理多个模型配置，并在对话中按需切换。
        </p>
      </div>
      <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
        <Button
          type="button"
          variant={inputMode === "form" ? "default" : "ghost"}
          size="sm"
          onClick={() => onInputModeChange("form")}
          className="rounded-lg"
        >
          输入
        </Button>
        <Button
          type="button"
          variant={inputMode === "raw" ? "default" : "ghost"}
          size="sm"
          onClick={() => onInputModeChange("raw")}
          className="rounded-lg"
        >
          Raw
        </Button>
      </div>
    </header>
  );
}
