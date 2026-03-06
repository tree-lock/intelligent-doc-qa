import { useState } from "react";
import {
  type SystemSettings,
  SYSTEM_SETTINGS_LIMITS,
  DEFAULT_SYSTEM_SETTINGS,
} from "../lib/system-settings";
import {
  loadSystemSettings,
  resetSystemSettings,
  saveSystemSettings,
} from "../lib/system-settings-storage";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export type SettingsFieldErrors = Partial<Record<keyof SystemSettings, string>>;

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

function validateSettings(settings: SystemSettings) {
  const errors: SettingsFieldErrors = {};

  if (settings.selectedModelType === "custom") {
    if (!settings.customProvider.trim()) {
      errors.customProvider = "自定义 Provider 不能为空";
    }
    if (!settings.customModelName.trim()) {
      errors.customModelName = "自定义模型名不能为空";
    }
    if (!settings.apiKey.trim()) {
      errors.apiKey = "API Key 不能为空";
    }
  }

  validateNumberRange("temperature", settings.temperature, errors);
  validateNumberRange("topP", settings.topP, errors);
  validateNumberRange("maxTokens", settings.maxTokens, errors);

  return errors;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(() =>
    loadSystemSettings(),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});

  const setField = <K extends keyof SystemSettings>(
    field: K,
    value: SystemSettings[K],
  ) => {
    setSettings((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      return { ...previous, [field]: undefined };
    });
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
    }
  };

  const save = async () => {
    setSaveStatus("saving");
    await Promise.resolve();

    const trimmedSettings: SystemSettings = {
      ...settings,
      customProvider: settings.customProvider.trim(),
      customModelName: settings.customModelName.trim(),
      apiKey: settings.apiKey.trim(),
      maxTokens: Math.round(settings.maxTokens),
    };

    const errors = validateSettings(trimmedSettings);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaveStatus("error");
      return false;
    }

    saveSystemSettings(trimmedSettings);
    setSettings(trimmedSettings);
    setSaveStatus("success");
    return true;
  };

  const reset = () => {
    const nextSettings = resetSystemSettings();
    setSettings(nextSettings);
    setFieldErrors({});
    setSaveStatus("idle");
  };

  return {
    settings,
    saveStatus,
    fieldErrors,
    setField,
    save,
    reset,
    defaults: DEFAULT_SYSTEM_SETTINGS,
  };
}

export { validateSettings };
