import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLLMConfig,
  deleteLLMConfig,
  fetchLLMConfigs,
  fetchProviders,
  updateLLMConfig,
} from "../lib/api/system";
import {
  DEFAULT_LLM_CONFIG_DRAFT,
  type LLMConfig,
  type LLMConfigCreateInput,
  type LLMConfigDraft,
  type LLMConfigUpdateInput,
  SYSTEM_SETTINGS_LIMITS,
  toLLMConfigDraft,
} from "../lib/system-settings";
import { llmConfigsQueryKey } from "./use-llm-configs-query";

const EMPTY_CONFIGS: LLMConfig[] = [];
const EMPTY_PROVIDERS: string[] = [];

export type SaveStatus = "idle" | "saving" | "success" | "error";

export type SettingsFieldErrors = Partial<Record<keyof LLMConfigDraft, string>>;

const NUMBER_LABELS: Record<"temperature" | "topP" | "maxTokens", string> = {
  temperature: "Temperature",
  topP: "Top P",
  maxTokens: "Max Tokens",
};

function validateNumberRange(
  field: "temperature" | "topP" | "maxTokens",
  value: number,
  errors: SettingsFieldErrors,
) {
  const limits = SYSTEM_SETTINGS_LIMITS[field];
  if (Number.isNaN(value)) {
    errors[field] = `${NUMBER_LABELS[field]} 必须是数字`;
    return;
  }

  if (value < limits.min || value > limits.max) {
    errors[field] =
      `${NUMBER_LABELS[field]} 必须在 ${limits.min}-${limits.max} 范围内`;
  }
}

function validateSettings(settings: LLMConfigDraft) {
  const errors: SettingsFieldErrors = {};

  if (!settings.name.trim()) {
    errors.name = "配置名称不能为空";
  }
  if (!settings.provider.trim()) {
    errors.provider = "Provider 不能为空";
  }
  if (!settings.modelName.trim()) {
    errors.modelName = "模型名称不能为空";
  }
  if (
    ["openai", "claude"].includes(
      settings.provider.trim().toLowerCase(),
    ) &&
    !settings.apiKey.trim() &&
    !settings.hasApiKey
  ) {
    errors.apiKey = "API Key 不能为空";
  }
  if (
    ["local", "community"].includes(settings.provider.trim().toLowerCase()) &&
    !settings.apiBase.trim()
  ) {
    errors.apiBase = "本地或社区模型必须填写 API Base";
  }

  validateNumberRange("temperature", settings.temperature, errors);
  validateNumberRange("topP", settings.topP, errors);
  validateNumberRange("maxTokens", settings.maxTokens, errors);

  return errors;
}

export function useSystemSettings() {
  const queryClient = useQueryClient();
  const { data: configs = EMPTY_CONFIGS } = useQuery({
    queryKey: llmConfigsQueryKey,
    queryFn: fetchLLMConfigs,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const { data: providers = EMPTY_PROVIDERS } = useQuery({
    queryKey: ["provider-options"],
    queryFn: fetchProviders,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LLMConfigDraft>(DEFAULT_LLM_CONFIG_DRAFT);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedConfig = useMemo(
    () => configs.find((item) => item.id === selectedConfigId) ?? null,
    [configs, selectedConfigId],
  );

  const firstProvider = providers[0] ?? DEFAULT_LLM_CONFIG_DRAFT.provider;
  const configIds = useMemo(
    () => configs.map((c) => c.id).join(","),
    [configs],
  );
  const configsLength = configs.length;
  const configsRef = useRef(configs);
  configsRef.current = configs;

  useEffect(() => {
    const configs = configsRef.current;
    if (configs.length === 0) {
      setSelectedConfigId((prev) => (prev === null ? prev : null));
      setDraft((prev) => {
        if (prev.provider === firstProvider && prev.name === "") {
          return prev;
        }
        return { ...DEFAULT_LLM_CONFIG_DRAFT, provider: firstProvider };
      });
      return;
    }
    if (
      selectedConfigId &&
      configs.some((item) => item.id === selectedConfigId)
    ) {
      return;
    }
    const nextSelected = configs.find((item) => item.isDefault) ?? configs[0];
    if (nextSelected) {
      setSelectedConfigId(nextSelected.id);
      setDraft(toLLMConfigDraft(nextSelected));
    }
  }, [configsLength, configIds, firstProvider, selectedConfigId]);

  const createMutation = useMutation({
    mutationFn: (payload: LLMConfigCreateInput) => createLLMConfig(payload),
  });
  const updateMutation = useMutation({
    mutationFn: ({
      configId,
      payload,
    }: {
      configId: string;
      payload: LLMConfigUpdateInput;
    }) => updateLLMConfig(configId, payload),
  });
  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteLLMConfig(configId),
  });

  const setField = <K extends keyof LLMConfigDraft>(
    field: K,
    value: LLMConfigDraft[K],
  ) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      return { ...previous, [field]: undefined };
    });
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const selectConfig = (configId: string) => {
    const config = configs.find((item) => item.id === configId);
    if (!config) {
      return;
    }
    setSelectedConfigId(config.id);
    setDraft(toLLMConfigDraft(config));
    setFieldErrors({});
    setSaveStatus("idle");
    setErrorMessage(null);
  };

  const createNew = () => {
    setSelectedConfigId(null);
    setDraft({
      ...DEFAULT_LLM_CONFIG_DRAFT,
      provider: providers[0] ?? DEFAULT_LLM_CONFIG_DRAFT.provider,
    });
    setFieldErrors({});
    setSaveStatus("idle");
    setErrorMessage(null);
  };

  const save = async () => {
    setSaveStatus("saving");
    setErrorMessage(null);

    const trimmedSettings: LLMConfigDraft = {
      ...draft,
      name: draft.name.trim(),
      provider: draft.provider.trim().toLowerCase(),
      apiKey: draft.apiKey.trim(),
      apiBase: draft.apiBase.trim(),
      modelName: draft.modelName.trim(),
      maxTokens: Math.round(draft.maxTokens),
    };

    const errors = validateSettings(trimmedSettings);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaveStatus("error");
      return false;
    }

    try {
      const payload = toConfigPayload(trimmedSettings, selectedConfig);
      const savedConfig = selectedConfigId
        ? await updateMutation.mutateAsync({
            configId: selectedConfigId,
            payload,
          })
        : await createMutation.mutateAsync(payload as LLMConfigCreateInput);
      queryClient.setQueryData<LLMConfig[]>(
        llmConfigsQueryKey,
        (previous = []) => upsertConfig(previous, savedConfig),
      );
      setSelectedConfigId(savedConfig.id);
      setDraft(toLLMConfigDraft(savedConfig));
      setSaveStatus("success");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败");
      setSaveStatus("error");
      return false;
    }
  };

  const remove = async () => {
    if (!selectedConfigId) {
      createNew();
      return false;
    }
    setSaveStatus("saving");
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(selectedConfigId);
      queryClient.setQueryData<LLMConfig[]>(
        llmConfigsQueryKey,
        (previous = []) =>
          previous.filter((item) => item.id !== selectedConfigId),
      );
      const remainingConfigs =
        queryClient.getQueryData<LLMConfig[]>(llmConfigsQueryKey) ?? [];
      const nextSelected =
        remainingConfigs.find((item) => item.isDefault) ??
        remainingConfigs[0] ??
        null;
      if (nextSelected) {
        setSelectedConfigId(nextSelected.id);
        setDraft(toLLMConfigDraft(nextSelected));
      } else {
        createNew();
      }
      setFieldErrors({});
      setSaveStatus("success");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除失败");
      setSaveStatus("error");
      return false;
    }
  };

  const setAsDefault = async () => {
    if (!selectedConfigId) {
      return false;
    }
    setSaveStatus("saving");
    setErrorMessage(null);
    try {
      const savedConfig = await updateMutation.mutateAsync({
        configId: selectedConfigId,
        payload: { isDefault: true },
      });
      queryClient.setQueryData<LLMConfig[]>(
        llmConfigsQueryKey,
        (previous = []) =>
          previous.map((item) =>
            item.id === savedConfig.id
              ? savedConfig
              : { ...item, isDefault: false },
          ),
      );
      setDraft(toLLMConfigDraft(savedConfig));
      setSaveStatus("success");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "设为默认失败");
      setSaveStatus("error");
      return false;
    }
  };

  const reset = () => {
    if (selectedConfig) {
      setDraft(toLLMConfigDraft(selectedConfig));
    } else {
      setDraft({
        ...DEFAULT_LLM_CONFIG_DRAFT,
        provider: providers[0] ?? DEFAULT_LLM_CONFIG_DRAFT.provider,
      });
    }
    setFieldErrors({});
    setSaveStatus("idle");
    setErrorMessage(null);
  };

  return {
    configs,
    providers,
    selectedConfigId,
    selectedConfig,
    draft,
    saveStatus,
    errorMessage,
    fieldErrors,
    selectConfig,
    createNew,
    setField,
    save,
    remove,
    setAsDefault,
    reset,
  };
}

export { validateSettings };

function toConfigPayload(
  draft: LLMConfigDraft,
  currentConfig: LLMConfig | null,
): LLMConfigCreateInput | LLMConfigUpdateInput {
  const payload: LLMConfigCreateInput = {
    name: draft.name,
    provider: draft.provider,
    apiBase: draft.apiBase || undefined,
    modelName: draft.modelName,
    temperature: draft.temperature,
    topP: draft.topP,
    maxTokens: draft.maxTokens,
    isDefault: draft.isDefault,
  };
  if (draft.apiKey) {
    payload.apiKey = draft.apiKey;
  } else if (!currentConfig?.hasApiKey) {
    payload.apiKey = "";
  }
  return payload;
}

function upsertConfig(configs: LLMConfig[], nextConfig: LLMConfig) {
  const nextItems = configs.filter((item) => item.id !== nextConfig.id);
  const normalizedItems = nextConfig.isDefault
    ? nextItems.map((item) => ({ ...item, isDefault: false }))
    : nextItems;
  return [nextConfig, ...normalizedItems].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
