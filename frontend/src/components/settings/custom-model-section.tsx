import { SettingsField } from "./settings-field";

type CustomModelSectionProps = {
  customProvider: string;
  customModelName: string;
  apiKey: string;
  fieldErrors: {
    customProvider?: string;
    customModelName?: string;
    apiKey?: string;
  };
  onFieldChange: (
    field: "customProvider" | "customModelName" | "apiKey",
    value: string,
  ) => void;
};

export function CustomModelSection({
  customProvider,
  customModelName,
  apiKey,
  fieldErrors,
  onFieldChange,
}: CustomModelSectionProps) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <SettingsField
        label="自定义 Provider"
        value={customProvider}
        onChange={(v) => onFieldChange("customProvider", String(v))}
        placeholder="例如：Qwen"
        error={fieldErrors.customProvider}
      />
      <SettingsField
        label="模型名"
        value={customModelName}
        onChange={(v) => onFieldChange("customModelName", String(v))}
        placeholder="例如：Qwen3.5-plus"
        error={fieldErrors.customModelName}
      />
      <SettingsField
        label="API Key"
        value={apiKey}
        onChange={(v) => onFieldChange("apiKey", String(v))}
        type="password"
        placeholder="请输入 API Key"
        hint="仅保存在当前浏览器本地，不会自动上传。"
        error={fieldErrors.apiKey}
        className="md:col-span-2"
      />
    </section>
  );
}
