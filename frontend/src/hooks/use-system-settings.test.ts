import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SYSTEM_SETTINGS_STORAGE_KEY } from "../lib/system-settings-storage";
import { useSystemSettings } from "./use-system-settings";

describe("useSystemSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads settings from localStorage on init", () => {
    window.localStorage.setItem(
      SYSTEM_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        selectedModelType: "custom",
        builtinModel: "minimax",
        customProvider: "Qwen",
        customModelName: "Qwen3.5-plus",
        apiKey: "abc",
        temperature: 0.3,
        topP: 0.7,
        maxTokens: 1500,
      }),
    );

    const { result } = renderHook(() => useSystemSettings());
    expect(result.current.settings.selectedModelType).toBe("custom");
    expect(result.current.settings.customProvider).toBe("Qwen");
    expect(result.current.settings.maxTokens).toBe(1500);
  });

  it("blocks save when custom model required fields are missing", async () => {
    const { result } = renderHook(() => useSystemSettings());

    act(() => {
      result.current.setField("selectedModelType", "custom");
      result.current.setField("customProvider", "");
      result.current.setField("customModelName", "");
      result.current.setField("apiKey", "");
    });

    let success = false;
    await act(async () => {
      success = await result.current.save();
    });

    expect(success).toBe(false);
    expect(result.current.saveStatus).toBe("error");
    expect(result.current.fieldErrors.customProvider).toBeTruthy();
    expect(result.current.fieldErrors.customModelName).toBeTruthy();
    expect(result.current.fieldErrors.apiKey).toBeTruthy();
  });

  it("saves custom model settings to localStorage", async () => {
    const { result } = renderHook(() => useSystemSettings());

    act(() => {
      result.current.setField("selectedModelType", "custom");
      result.current.setField("customProvider", " Qwen ");
      result.current.setField("customModelName", " Qwen3.5-plus ");
      result.current.setField("apiKey", " key-123 ");
    });

    await act(async () => {
      await result.current.save();
    });

    const rawSaved = window.localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    expect(rawSaved).toBeTruthy();
    const saved = JSON.parse(rawSaved ?? "{}") as {
      customProvider?: string;
      customModelName?: string;
      apiKey?: string;
      selectedModelType?: string;
    };

    expect(saved.selectedModelType).toBe("custom");
    expect(saved.customProvider).toBe("Qwen");
    expect(saved.customModelName).toBe("Qwen3.5-plus");
    expect(saved.apiKey).toBe("key-123");
    expect(result.current.saveStatus).toBe("success");
  });

  it("resets settings and persists defaults", () => {
    const { result } = renderHook(() => useSystemSettings());

    act(() => {
      result.current.setField("selectedModelType", "custom");
      result.current.setField("customProvider", "Qwen");
      result.current.setField("customModelName", "Qwen3.5-plus");
      result.current.setField("apiKey", "secret");
      result.current.reset();
    });

    expect(result.current.settings.selectedModelType).toBe("builtin");

    const rawSaved = window.localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    const saved = JSON.parse(rawSaved ?? "{}") as {
      selectedModelType?: string;
      apiKey?: string;
    };
    expect(saved.selectedModelType).toBe("builtin");
    expect(saved.apiKey).toBe("");
  });
});
