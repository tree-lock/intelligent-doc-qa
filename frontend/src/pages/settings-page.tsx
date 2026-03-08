import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { APP_ROUTE_PATH } from "../app/route-config";
import { ParametersSection } from "../components/settings/parameters-section";
import { SettingsField } from "../components/settings/settings-field";
import { Button } from "../components/ui/button";
import { useSystemSettings } from "../hooks/use-system-settings";
import { fetchMineruTokenStatus, updateMineruToken } from "../lib/api/system";
import {
  DEFAULT_LLM_CONFIG_DRAFT,
  draftToRawJson,
  parseRawJsonToDraft,
  toLLMConfigDraft,
} from "../lib/system-settings";

const MINERU_QUERY_KEY = ["mineru-token"] as const;
type InputMode = "form" | "raw";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mineruInputRef = useRef<HTMLInputElement | null>(null);
  const [mineruHighlight, setMineruHighlight] = useState(false);
  const [mineruToken, setMineruToken] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("form");
  const [rawJsonString, setRawJsonString] = useState(
    draftToRawJson(DEFAULT_LLM_CONFIG_DRAFT),
  );
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);

  const { data: mineruStatus } = useQuery({
    queryKey: MINERU_QUERY_KEY,
    queryFn: fetchMineruTokenStatus,
  });

  const mineruSaveMutation = useMutation({
    mutationFn: (token: string | null) => updateMineruToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINERU_QUERY_KEY });
      setMineruToken("");
      toast.success("MinerU Token 已保存");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "保存失败");
    },
  });

  const handleSaveMineruToken = () => {
    const value = mineruToken.trim() || null;
    mineruSaveMutation.mutate(value);
  };

  const {
    configs,
    providers,
    selectedConfigId,
    selectedConfig,
    draft,
    saveStatus,
    testStatus,
    errorMessage,
    testMessage,
    fieldErrors,
    selectConfig,
    createNew,
    replaceDraft,
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
  const nextNewDraft = {
    ...DEFAULT_LLM_CONFIG_DRAFT,
    provider: providers[0] ?? DEFAULT_LLM_CONFIG_DRAFT.provider,
  };

  useEffect(() => {
    if (inputMode === "raw" && saveStatus === "success") {
      setRawJsonString(draftToRawJson(draft));
      setRawJsonError(null);
    }
  }, [draft, inputMode, saveStatus]);

  useEffect(() => {
    if (searchParams.get("focus") !== "mineru") {
      return;
    }
    setMineruHighlight(true);
    mineruInputRef.current?.focus();
    mineruInputRef.current?.scrollIntoView({ behavior: "smooth" });
    navigate(APP_ROUTE_PATH.settings, { replace: true });
    const t = setTimeout(() => setMineruHighlight(false), 4000);
    return () => clearTimeout(t);
  }, [navigate, searchParams]);

  const applyRawJsonToDraft = () => {
    const result = parseRawJsonToDraft(rawJsonString);

    if (!result.success) {
      setRawJsonError(result.error);
      toast.error(result.error);
      return null;
    }

    const nextDraft = {
      ...result.draft,
      hasApiKey: draft.hasApiKey,
    };

    replaceDraft(nextDraft);
    setRawJsonString(draftToRawJson(nextDraft));
    setRawJsonError(null);
    return nextDraft;
  };

  const handleInputModeChange = (nextMode: InputMode) => {
    if (nextMode === inputMode) {
      return;
    }

    if (nextMode === "raw") {
      setRawJsonString(draftToRawJson(draft));
      setRawJsonError(null);
      setInputMode("raw");
      return;
    }

    if (!applyRawJsonToDraft()) {
      return;
    }

    setInputMode("form");
  };

  const handleSave = async () => {
    if (inputMode === "raw") {
      const nextDraft = applyRawJsonToDraft();
      if (!nextDraft) {
        return;
      }
      await save(nextDraft);
      return;
    }
    await save();
  };

  const handleDelete = async () => {
    await remove();
  };

  const handleSetDefault = async () => {
    await setAsDefault();
  };

  const handleTestConnection = async () => {
    if (inputMode === "raw") {
      const nextDraft = applyRawJsonToDraft();
      if (!nextDraft) {
        return;
      }
      await testConnection(nextDraft);
      return;
    }
    await testConnection();
  };

  const handleSelectConfig = (configId: string) => {
    const config = configs.find((item) => item.id === configId);
    if (!config) {
      return;
    }

    selectConfig(configId);
    setRawJsonString(draftToRawJson(toLLMConfigDraft(config)));
    setRawJsonError(null);
  };

  const handleCreateNew = () => {
    createNew();
    setRawJsonString(draftToRawJson(nextNewDraft));
    setRawJsonError(null);
  };

  const handleReset = () => {
    reset();
    setRawJsonString(
      draftToRawJson(
        selectedConfig ? toLLMConfigDraft(selectedConfig) : nextNewDraft,
      ),
    );
    setRawJsonError(null);
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
            onClick={handleCreateNew}
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
                onClick={() => handleSelectConfig(config.id)}
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
              onClick={() => handleInputModeChange("form")}
              className="rounded-lg"
            >
              输入
            </Button>
            <Button
              type="button"
              variant={inputMode === "raw" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleInputModeChange("raw")}
              className="rounded-lg"
            >
              Raw
            </Button>
          </div>
        </header>

        {inputMode === "form" ? (
          <>
            <section className="grid min-w-[632px] gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-2">
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
                  draft.hasApiKey ? "••••••••••••••••" : "请输入 API Key"
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
                  onChange={(event) =>
                    setField("isDefault", event.target.checked)
                  }
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
          </>
        ) : (
          <section className="space-y-4 min-w-[632px] rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Raw JSON
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  使用一个 JSON 同时编辑大模型 provider 与模型输出配置。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const result = parseRawJsonToDraft(rawJsonString);
                  if (!result.success) {
                    setRawJsonError(result.error);
                    toast.error(result.error);
                    return;
                  }
                  setRawJsonString(
                    draftToRawJson({
                      ...result.draft,
                      hasApiKey: draft.hasApiKey,
                    }),
                  );
                  setRawJsonError(null);
                }}
                disabled={isBusy}
                className="rounded-lg"
              >
                格式化 JSON
              </Button>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Raw JSON</span>
              <textarea
                value={rawJsonString}
                onChange={(event) => {
                  setRawJsonString(event.target.value);
                  if (rawJsonError) {
                    setRawJsonError(null);
                  }
                }}
                spellCheck={false}
                className="min-h-[360px] w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm text-foreground focus:border-ring focus:outline-none"
                placeholder={`{\n  "name": "OpenAI 主模型",\n  "provider": "openai",\n  "modelName": "gpt-4o-mini",\n  "apiBase": "",\n  "apiKey": "",\n  "temperature": 0.7,\n  "topP": 0.9,\n  "maxTokens": 2000,\n  "isDefault": true\n}`}
              />
            </label>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>大模型 provider：`name`、`provider`</p>
              <p>
                模型输出配置：`modelName`、`apiBase`、`apiKey`、`temperature`、`topP`、`maxTokens`、`isDefault`
              </p>
              {draft.hasApiKey ? (
                <p>
                  当前配置已保存 API Key，Raw 中保留空字符串不会覆盖已有密钥。
                </p>
              ) : null}
            </div>

            {rawJsonError ? (
              <p className="text-sm text-red-600">{rawJsonError}</p>
            ) : null}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            文档解析 - MinerU
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            用于解析 PDF、Word、PPT、图片、HTML 等非文本文档。在{" "}
            <a
              href="https://mineru.net/apiManage"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              mineru.net
            </a>{" "}
            申请 Token。
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1 space-y-1">
              <label
                htmlFor="mineru-token"
                className="text-sm text-muted-foreground"
              >
                MinerU API Token
              </label>
              <input
                ref={mineruInputRef}
                id="mineru-token"
                type="password"
                value={mineruToken}
                onChange={(e) => setMineruToken(e.target.value)}
                onBlur={() => setMineruHighlight(false)}
                placeholder={
                  mineruStatus?.hasToken
                    ? "••••••••••••••••"
                    : "请输入 MinerU API Token"
                }
                className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none ${mineruHighlight ? "ring-2 ring-primary" : ""}`}
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveMineruToken}
              disabled={mineruSaveMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {mineruSaveMutation.isPending ? "保存中..." : "保存 Token"}
            </Button>
          </div>
          {mineruStatus?.hasToken ? (
            <p className="mt-2 text-xs text-emerald-600">已配置</p>
          ) : null}
        </section>

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
              onClick={handleReset}
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
