export type ModelSource = "builtin" | "custom";

export type BuiltinModelId = "minimax";

export type SystemSettings = {
  selectedModelType: ModelSource;
  builtinModel: BuiltinModelId;
  customProvider: string;
  customModelName: string;
  apiKey: string;
  temperature: number;
  topP: number;
  maxTokens: number;
};

export const BUILTIN_MODELS: Array<{ id: BuiltinModelId; label: string }> = [
  { id: "minimax", label: "MiniMax" },
];

export const SYSTEM_SETTINGS_LIMITS = {
  temperature: { min: 0, max: 1, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.1 },
  maxTokens: { min: 1, max: 32768, step: 1 },
} as const;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  selectedModelType: "builtin",
  builtinModel: "minimax",
  customProvider: "",
  customModelName: "",
  apiKey: "",
  temperature: 0.6,
  topP: 0.9,
  maxTokens: 1024,
};
