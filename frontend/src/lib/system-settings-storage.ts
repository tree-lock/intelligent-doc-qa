import {
  BUILTIN_MODELS,
  type BuiltinModelId,
  DEFAULT_SYSTEM_SETTINGS,
  type ModelSource,
  SYSTEM_SETTINGS_LIMITS,
  type SystemSettings,
} from "./system-settings";

const SYSTEM_SETTINGS_STORAGE_KEY = "doc-qa.system-settings.v1";
const isBrowser = typeof window !== "undefined";

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function asModelSource(value: unknown): ModelSource {
  if (value === "builtin" || value === "custom") {
    return value;
  }
  return DEFAULT_SYSTEM_SETTINGS.selectedModelType;
}

function asBuiltinModel(value: unknown): BuiltinModelId {
  const builtinIds = BUILTIN_MODELS.map((item) => item.id);
  if (
    typeof value === "string" &&
    builtinIds.includes(value as BuiltinModelId)
  ) {
    return value as BuiltinModelId;
  }
  return DEFAULT_SYSTEM_SETTINGS.builtinModel;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

function asTemperature(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return clampNumber(
    numberValue,
    SYSTEM_SETTINGS_LIMITS.temperature.min,
    SYSTEM_SETTINGS_LIMITS.temperature.max,
  );
}

function asTopP(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return clampNumber(
    numberValue,
    SYSTEM_SETTINGS_LIMITS.topP.min,
    SYSTEM_SETTINGS_LIMITS.topP.max,
  );
}

function asMaxTokens(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  const rounded = Math.round(numberValue);
  return clampNumber(
    rounded,
    SYSTEM_SETTINGS_LIMITS.maxTokens.min,
    SYSTEM_SETTINGS_LIMITS.maxTokens.max,
  );
}

export function sanitizeSystemSettings(rawValue: unknown): SystemSettings {
  const payload = asRecord(rawValue);
  if (!payload) {
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }

  return {
    selectedModelType: asModelSource(payload.selectedModelType),
    builtinModel: asBuiltinModel(payload.builtinModel),
    customProvider: asString(
      payload.customProvider,
      DEFAULT_SYSTEM_SETTINGS.customProvider,
    ),
    customModelName: asString(
      payload.customModelName,
      DEFAULT_SYSTEM_SETTINGS.customModelName,
    ),
    apiKey: asString(payload.apiKey, DEFAULT_SYSTEM_SETTINGS.apiKey),
    temperature: asTemperature(payload.temperature),
    topP: asTopP(payload.topP),
    maxTokens: asMaxTokens(payload.maxTokens),
  };
}

export function loadSystemSettings() {
  if (!isBrowser) {
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }

  try {
    const rawValue = window.localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_SYSTEM_SETTINGS };
    }
    const parsedValue = JSON.parse(rawValue) as unknown;
    return sanitizeSystemSettings(parsedValue);
  } catch {
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }
}

export function saveSystemSettings(settings: SystemSettings) {
  if (!isBrowser) {
    return;
  }

  try {
    const safeSettings = sanitizeSystemSettings(settings);
    window.localStorage.setItem(
      SYSTEM_SETTINGS_STORAGE_KEY,
      JSON.stringify(safeSettings),
    );
  } catch {
    // Ignore persistence failures in UI skeleton mode.
  }
}

export function resetSystemSettings() {
  saveSystemSettings(DEFAULT_SYSTEM_SETTINGS);
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

export { SYSTEM_SETTINGS_STORAGE_KEY };
