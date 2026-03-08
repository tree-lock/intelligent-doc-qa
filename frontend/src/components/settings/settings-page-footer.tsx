import type {
  ConnectionTestStatus,
  SaveStatus,
} from "../../hooks/use-system-settings";
import { Button } from "../ui/button";

export type SettingsPageFooterProps = {
  saveStatus: SaveStatus;
  testStatus: ConnectionTestStatus;
  saveStatusText: string | null;
  testStatusText: string | null;
  isBusy: boolean;
  isSaving: boolean;
  isTesting: boolean;
  selectedConfigId: string | null;
  onReset: () => void;
  onTestConnection: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onSave: () => void;
};

export function SettingsPageFooter({
  saveStatus,
  testStatus,
  saveStatusText,
  testStatusText,
  isBusy,
  isSaving,
  isTesting,
  selectedConfigId,
  onReset,
  onTestConnection,
  onSetDefault,
  onDelete,
  onSave,
}: SettingsPageFooterProps) {
  return (
    <footer className="flex flex-col items-end justify-between gap-2">
      <div className="min-w-0 flex-1 text-sm">
        {saveStatusText ? (
          <span
            className={`wrap-break-word ${
              saveStatus === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {saveStatusText}
          </span>
        ) : null}
        {!saveStatusText && testStatusText ? (
          <span
            className={`wrap-break-word ${
              testStatus === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {testStatusText}
          </span>
        ) : null}
      </div>
      <div className="shrink-0 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isBusy}
          className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
        >
          重置
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onTestConnection}
          disabled={isBusy}
          className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
        >
          {isTesting ? "检测中..." : "测试连通性"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSetDefault}
          disabled={isBusy || !selectedConfigId}
          className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
        >
          设为默认
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          disabled={isBusy || !selectedConfigId}
          className="rounded-lg border-red-200 px-4 py-2 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          删除
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isBusy}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
      </div>
    </footer>
  );
}
