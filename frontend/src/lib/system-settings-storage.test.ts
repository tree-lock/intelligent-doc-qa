import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SYSTEM_SETTINGS } from "./system-settings";
import {
  SYSTEM_SETTINGS_STORAGE_KEY,
  loadSystemSettings,
  saveSystemSettings,
  sanitizeSystemSettings,
} from "./system-settings-storage";

describe("system-settings-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns default settings when storage is empty", () => {
    expect(loadSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);
  });

  it("round-trips saved settings from localStorage", () => {
    const sample = {
      ...DEFAULT_SYSTEM_SETTINGS,
      selectedModelType: "custom" as const,
      customProvider: "Qwen",
      customModelName: "Qwen3.5-plus",
      apiKey: "secret-key",
      maxTokens: 2048,
    };

    saveSystemSettings(sample);

    expect(loadSystemSettings()).toEqual(sample);
  });

  it("sanitizes invalid payload values", () => {
    window.localStorage.setItem(
      SYSTEM_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        selectedModelType: "unknown",
        builtinModel: "unknown",
        customProvider: 123,
        customModelName: false,
        apiKey: null,
        temperature: 8,
        topP: -2,
        maxTokens: 0,
      }),
    );

    const next = loadSystemSettings();
    expect(next.selectedModelType).toBe(
      DEFAULT_SYSTEM_SETTINGS.selectedModelType,
    );
    expect(next.builtinModel).toBe(DEFAULT_SYSTEM_SETTINGS.builtinModel);
    expect(next.customProvider).toBe("");
    expect(next.customModelName).toBe("");
    expect(next.apiKey).toBe("");
    expect(next.temperature).toBe(1);
    expect(next.topP).toBe(0);
    expect(next.maxTokens).toBe(1);
  });

  it("returns default settings for non-object payloads", () => {
    expect(sanitizeSystemSettings("invalid-json-shape")).toEqual(
      DEFAULT_SYSTEM_SETTINGS,
    );
  });
});
