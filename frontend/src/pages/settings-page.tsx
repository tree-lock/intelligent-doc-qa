import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { APP_ROUTE_PATH } from "../app/route-config";
import { ConfigListSidebar } from "../components/settings/config-list-sidebar";
import { MinerUSection } from "../components/settings/mineru-section";
import { ParametersSection } from "../components/settings/parameters-section";
import { RawJsonSection } from "../components/settings/raw-json-section";
import { SettingsField } from "../components/settings/settings-field";
import { SettingsPageFooter } from "../components/settings/settings-page-footer";
import {
  type InputMode,
  SettingsPageHeader,
} from "../components/settings/settings-page-header";
import { useSystemSettings } from "../hooks/use-system-settings";
import { fetchMineruTokenStatus, updateMineruToken } from "../lib/api/system";
import {
  DEFAULT_LLM_CONFIG_DRAFT,
  draftToRawJson,
  parseRawJsonToDraft,
  toLLMConfigDraft,
} from "../lib/system-settings";

const MINERU_QUERY_KEY = ["mineru-token"] as const;

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
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focus");
    const query = nextParams.toString();
    navigate(
      query ? `${APP_ROUTE_PATH.settings}?${query}` : APP_ROUTE_PATH.settings,
      { replace: true },
    );
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

  const handleFormatRawJson = () => {
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
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ConfigListSidebar
        configs={configs}
        selectedConfigId={selectedConfigId}
        onSelectConfig={handleSelectConfig}
        onCreateNew={handleCreateNew}
      />

      <div className="space-y-6">
        <SettingsPageHeader
          inputMode={inputMode}
          onInputModeChange={handleInputModeChange}
        />

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
          <RawJsonSection
            rawJsonString={rawJsonString}
            rawJsonError={rawJsonError}
            hasApiKey={draft.hasApiKey}
            isBusy={isBusy}
            onRawJsonChange={(value) => {
              setRawJsonString(value);
              setRawJsonError(null);
            }}
            onFormat={handleFormatRawJson}
          />
        )}

        <MinerUSection
          mineruToken={mineruToken}
          mineruStatus={mineruStatus}
          mineruHighlight={mineruHighlight}
          isPending={mineruSaveMutation.isPending}
          inputRef={mineruInputRef}
          onTokenChange={setMineruToken}
          onSave={handleSaveMineruToken}
          onBlur={() => setMineruHighlight(false)}
        />

        <SettingsPageFooter
          saveStatus={saveStatus}
          testStatus={testStatus}
          saveStatusText={saveStatusText}
          testStatusText={testStatusText}
          isBusy={isBusy}
          isSaving={isSaving}
          isTesting={isTesting}
          selectedConfigId={selectedConfigId}
          onReset={handleReset}
          onTestConnection={handleTestConnection}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
