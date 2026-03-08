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
> & { configId?: string };

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

type RawLLMConfigShape = {
  name?: unknown;
  provider?: unknown;
  apiKey?: unknown;
  apiBase?: unknown;
  modelName?: unknown;
  temperature?: unknown;
  topP?: unknown;
  maxTokens?: unknown;
  isDefault?: unknown;
};

export type RawLLMConfigParseResult =
  | { success: true; draft: LLMConfigDraft }
  | { success: false; error: string };

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

export function draftToRawJson(draft: LLMConfigDraft): string {
  return JSON.stringify(
    {
      name: draft.name,
      provider: draft.provider,
      modelName: draft.modelName,
      apiBase: draft.apiBase,
      apiKey: draft.hasApiKey && !draft.apiKey ? "" : draft.apiKey,
      temperature: draft.temperature,
      topP: draft.topP,
      maxTokens: draft.maxTokens,
      isDefault: draft.isDefault,
    },
    null,
    2,
  );
}

export function parseRawJsonToDraft(raw: string): RawLLMConfigParseResult {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(raw);
  } catch {
    return {
      success: false,
      error: "Raw JSON 格式不正确，请检查逗号、引号和括号。",
    };
  }

  if (!isPlainObject(parsedValue)) {
    return {
      success: false,
      error: "Raw JSON 必须是一个对象。",
    };
  }

  const parsed = parsedValue as RawLLMConfigShape;

  try {
    return {
      success: true,
      draft: {
        ...DEFAULT_LLM_CONFIG_DRAFT,
        name: parseStringField(parsed.name, "name"),
        provider: parseStringField(parsed.provider, "provider"),
        apiKey: parseStringField(parsed.apiKey, "apiKey"),
        apiBase: parseStringField(parsed.apiBase, "apiBase"),
        modelName: parseStringField(parsed.modelName, "modelName"),
        temperature: clampNumber(
          "temperature",
          parseNumberField(parsed.temperature, "temperature"),
        ),
        topP: clampNumber("topP", parseNumberField(parsed.topP, "topP")),
        maxTokens: Math.round(
          clampNumber(
            "maxTokens",
            parseNumberField(parsed.maxTokens, "maxTokens"),
          ),
        ),
        isDefault: parseBooleanField(parsed.isDefault, "isDefault"),
        hasApiKey: false,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Raw JSON 解析失败",
    };
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringField(value: unknown, field: string): string {
  if (value === undefined) {
    return DEFAULT_LLM_CONFIG_DRAFT[field as keyof LLMConfigDraft] as string;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  throw new Error(`字段 ${field} 必须是字符串`);
}

function parseNumberField(
  value: unknown,
  field: keyof typeof SYSTEM_SETTINGS_LIMITS,
) {
  if (value === undefined) {
    return DEFAULT_LLM_CONFIG_DRAFT[field];
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const nextValue = Number(value);
    if (!Number.isNaN(nextValue)) {
      return nextValue;
    }
  }
  throw new Error(`字段 ${field} 必须是数字`);
}

function parseBooleanField(value: unknown, field: string): boolean {
  if (value === undefined) {
    return DEFAULT_LLM_CONFIG_DRAFT.isDefault;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  throw new Error(`字段 ${field} 必须是布尔值`);
}

function clampNumber(
  field: keyof typeof SYSTEM_SETTINGS_LIMITS,
  value: number,
): number {
  const limits = SYSTEM_SETTINGS_LIMITS[field];
  return Math.min(limits.max, Math.max(limits.min, value));
}
