import { ParametersSection } from "../components/settings/parameters-section";
import { SettingsField } from "../components/settings/settings-field";
import { Button } from "../components/ui/button";
import { useSystemSettings } from "../hooks/use-system-settings";

export function SettingsPage() {
  const {
    configs,
    providers,
    selectedConfigId,
    draft,
    saveStatus,
    testStatus,
    errorMessage,
    testMessage,
    fieldErrors,
    selectConfig,
    createNew,
    setField,
    save,
    testConnection,
    remove,
    setAsDefault,
    reset,
  } = useSystemSettings();

  const isSaving = saveStatus === "saving";
  const isTesting = testStatus === "testing";
  const isBusy = isSaving || isTesting;

  const handleSave = async () => {
    await save();
  };

  const handleDelete = async () => {
    await remove();
  };

  const handleSetDefault = async () => {
    await setAsDefault();
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  const saveStatusText =
    saveStatus === "success"
      ? "模型配置已保存到后端"
      : saveStatus === "error"
        ? (errorMessage ?? "保存失败，请检查必填项和参数范围")
        : null;

  const testStatusText =
    testStatus === "success"
      ? (testMessage ?? "模型连通性检测成功")
      : testStatus === "error"
        ? (testMessage ?? "模型连通性检测失败")
        : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              模型配置
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              不再提供内置模型，所有模型都需要手动配置。
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={createNew}
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
                onClick={() => selectConfig(config.id)}
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

      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">系统配置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            统一管理多个模型配置，并在对话中按需切换。
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-2">
          <SettingsField
            label="配置名称"
            value={draft.name}
            onChange={(value) => setField("name", String(value))}
            error={fieldErrors.name}
            placeholder="例如：OpenAI 主模型"
          />
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Provider</span>
            <select
              value={draft.provider}
              onChange={(event) => setField("provider", event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none"
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            {fieldErrors.provider ? (
              <span className="text-xs text-red-600">
                {fieldErrors.provider}
              </span>
            ) : null}
          </label>
          <SettingsField
            label="模型名称"
            value={draft.modelName}
            onChange={(value) => setField("modelName", String(value))}
            error={fieldErrors.modelName}
            placeholder="例如：gpt-4o-mini"
          />
          <SettingsField
            label="API Base"
            value={draft.apiBase}
            onChange={(value) => setField("apiBase", String(value))}
            error={fieldErrors.apiBase}
            placeholder="例如：http://localhost:11434/v1"
            hint={
              ["local", "community"].includes(draft.provider)
                ? "本地或社区模型必须填写 OpenAI 兼容的 API Base。"
                : "只有在需要自定义网关时才填写。"
            }
          />
          <SettingsField
            label="API Key"
            value={draft.apiKey}
            onChange={(value) => setField("apiKey", String(value))}
            error={fieldErrors.apiKey}
            type="password"
            placeholder={
              draft.hasApiKey ? "留空则保留现有密钥" : "请输入 API Key"
            }
            hint={
              draft.hasApiKey ? "当前密钥已保存，留空不会覆盖。" : undefined
            }
            className="md:col-span-2"
          />
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(event) => setField("isDefault", event.target.checked)}
            />
            设为默认模型
          </label>
        </section>

        <ParametersSection
          maxTokens={draft.maxTokens}
          temperature={draft.temperature}
          topP={draft.topP}
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
            {!saveStatusText && testStatusText ? (
              <span
                className={
                  testStatus === "success" ? "text-emerald-600" : "text-red-600"
                }
              >
                {testStatusText}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={isBusy}
              className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            >
              重置
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isBusy}
              className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            >
              {isTesting ? "检测中..." : "测试连通性"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSetDefault}
              disabled={isBusy || !selectedConfigId}
              className="rounded-lg border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            >
              设为默认
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isBusy || !selectedConfigId}
              className="rounded-lg border-red-200 px-4 py-2 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              删除
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {isSaving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
