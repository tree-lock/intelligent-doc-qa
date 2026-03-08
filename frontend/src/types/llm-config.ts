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

export type RawLLMConfigParseResult =
  | { success: true; draft: LLMConfigDraft }
  | { success: false; error: string };

export type ProviderListResponse = {
  items: string[];
};

export type LLMConfigListResponse = {
  items: LLMConfig[];
};

export type MineruTokenStatus = {
  hasToken: boolean;
};

export type SaveStatus = "idle" | "saving" | "success" | "error";
export type ConnectionTestStatus = "idle" | "testing" | "success" | "error";
export type SettingsFieldErrors = Partial<Record<keyof LLMConfigDraft, string>>;
