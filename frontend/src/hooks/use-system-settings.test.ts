import { describe, expect, it } from "vitest";
import type { LLMConfigDraft } from "../lib/system-settings";
import { validateSettings } from "./use-system-settings";

describe("useSystemSettings", () => {
  it("requires api key for remote providers without saved secret", () => {
    const draft: LLMConfigDraft = {
      name: "OpenAI 主模型",
      provider: "openai",
      apiKey: "",
      apiBase: "",
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      isDefault: true,
      hasApiKey: false,
    };

    const errors = validateSettings(draft);
    expect(errors.apiKey).toBeTruthy();
  });

  it("allows keeping existing secret when api key input is empty", () => {
    const draft: LLMConfigDraft = {
      name: "Claude 配置",
      provider: "claude",
      apiKey: "",
      apiBase: "",
      modelName: "claude-3-5-haiku-latest",
      temperature: 0.5,
      topP: 0.8,
      maxTokens: 1800,
      isDefault: false,
      hasApiKey: true,
    };

    const errors = validateSettings(draft);
    expect(errors.apiKey).toBeUndefined();
  });

  it("requires api base for local provider", () => {
    const draft: LLMConfigDraft = {
      name: "本地模型",
      provider: "local",
      apiKey: "",
      apiBase: "",
      modelName: "llama3",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      isDefault: false,
      hasApiKey: false,
    };

    const errors = validateSettings(draft);
    expect(errors.apiBase).toBeTruthy();
  });

  it("requires api base for community provider", () => {
    const draft: LLMConfigDraft = {
      name: "社区网关",
      provider: "community",
      apiKey: "",
      apiBase: "",
      modelName: "meta-llama",
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      isDefault: false,
      hasApiKey: false,
    };

    const errors = validateSettings(draft);
    expect(errors.apiBase).toBeTruthy();
  });
});
