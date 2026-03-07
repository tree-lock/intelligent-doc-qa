export type LLMConfig = {
  id: string;
  name: string;
  provider: string;
  apiBase: string;
  modelName: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  isDefault: boolean;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LLMConfigCreateInput = {
  name: string;
  provider: string;
  apiKey?: string;
  apiBase?: string;
  modelName: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  isDefault: boolean;
};

export type LLMConfigUpdateInput = Partial<LLMConfigCreateInput>;

export type LLMConfigConnectivityTestInput = Pick<
  LLMConfigCreateInput,
  "provider" | "apiKey" | "apiBase" | "modelName"
>;

export type LLMConfigConnectivityTestResult = {
  ok: boolean;
  detail: string | null;
};

export type LLMConfigDraft = {
  name: string;
  provider: string;
  apiKey: string;
  apiBase: string;
  modelName: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  isDefault: boolean;
  hasApiKey: boolean;
};

export const SYSTEM_SETTINGS_LIMITS = {
  temperature: { min: 0, max: 1, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.1 },
  maxTokens: { min: 1, max: 32768, step: 1 },
} as const;

export const DEFAULT_LLM_CONFIG_DRAFT: LLMConfigDraft = {
  name: "",
  provider: "openai",
  apiKey: "",
  apiBase: "",
  modelName: "",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2000,
  isDefault: false,
  hasApiKey: false,
};

export function toLLMConfigDraft(config?: LLMConfig): LLMConfigDraft {
  if (!config) {
    return { ...DEFAULT_LLM_CONFIG_DRAFT };
  }
  return {
    name: config.name,
    provider: config.provider,
    apiKey: "",
    apiBase: config.apiBase,
    modelName: config.modelName,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
    isDefault: config.isDefault,
    hasApiKey: config.hasApiKey,
  };
}
