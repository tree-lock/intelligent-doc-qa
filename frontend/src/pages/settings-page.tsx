import { BuiltinModelSection } from "../components/settings/builtin-model-section";
import { CustomModelSection } from "../components/settings/custom-model-section";
import { ModelSourceSection } from "../components/settings/model-source-section";
import { ParametersSection } from "../components/settings/parameters-section";
import { Button } from "../components/ui/button";
import { useSystemSettings } from "../hooks/use-system-settings";

export function SettingsPage() {
  const { settings, saveStatus, fieldErrors, setField, save, reset } =
    useSystemSettings();

  const isSaving = saveStatus === "saving";

  const handleSave = async () => {
    await save();
  };

  const saveStatusText =
    saveStatus === "success"
      ? "配置已保存到本地"
      : saveStatus === "error"
        ? "保存失败，请检查必填项和参数范围"
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">系统配置</h1>
        <p className="mt-1 text-sm text-slate-600">
          支持系统内置模型与自定义模型配置。当前版本保存到浏览器本地。
        </p>
      </header>

      <ModelSourceSection
        selectedModelType={settings.selectedModelType}
        onSelect={(v) => setField("selectedModelType", v)}
      />

      {settings.selectedModelType === "builtin" ? (
        <BuiltinModelSection
          selectedModel={settings.builtinModel}
          onSelect={(v) => setField("builtinModel", v)}
        />
      ) : (
        <CustomModelSection
          customProvider={settings.customProvider}
          customModelName={settings.customModelName}
          apiKey={settings.apiKey}
          fieldErrors={fieldErrors}
          onFieldChange={(field, value) => setField(field, value)}
        />
      )}

      <ParametersSection
        maxTokens={settings.maxTokens}
        temperature={settings.temperature}
        topP={settings.topP}
        fieldErrors={fieldErrors}
        onFieldChange={(field, value) => setField(field, value)}
      />

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          {saveStatusText ? (
            <span
              className={
                saveStatus === "success" ? "text-emerald-600" : "text-red-600"
              }
            >
              {saveStatusText}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          disabled={isSaving}
          className="rounded-lg border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          重置
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
      </footer>
    </div>
  );
}
