import { describe, expect, it } from "vitest";
import {
  DEFAULT_LLM_CONFIG_DRAFT,
  draftToRawJson,
  type LLMConfigDraft,
  parseRawJsonToDraft,
} from "./system-settings";

describe("system-settings raw json helpers", () => {
  it("serializes and parses editable draft fields", () => {
    const draft: LLMConfigDraft = {
      name: "OpenAI 主模型",
      provider: "openai",
      apiKey: "sk-test",
      apiBase: "",
      modelName: "gpt-4o-mini",
      temperature: 0.6,
      topP: 0.8,
      maxTokens: 4096,
      isDefault: true,
      hasApiKey: true,
    };

    const result = parseRawJsonToDraft(draftToRawJson(draft));

    expect(result).toEqual({
      success: true,
      draft: {
        ...draft,
        hasApiKey: false,
      },
    });
  });

  it("fills missing fields with defaults", () => {
    const result = parseRawJsonToDraft(
      JSON.stringify({
        name: "本地模型",
        provider: "local",
        modelName: "llama3",
      }),
    );

    expect(result).toEqual({
      success: true,
      draft: {
        ...DEFAULT_LLM_CONFIG_DRAFT,
        name: "本地模型",
        provider: "local",
        modelName: "llama3",
      },
    });
  });

  it("rejects invalid json text", () => {
    const result = parseRawJsonToDraft("{");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Raw JSON 格式不正确");
    }
  });

  it("rejects unsupported field types", () => {
    const result = parseRawJsonToDraft(
      JSON.stringify({
        provider: ["openai"],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("provider");
    }
  });

  it("normalizes numeric strings and clamps numeric limits", () => {
    const result = parseRawJsonToDraft(
      JSON.stringify({
        temperature: "2",
        topP: "-1",
        maxTokens: "999999",
      }),
    );

    expect(result).toEqual({
      success: true,
      draft: {
        ...DEFAULT_LLM_CONFIG_DRAFT,
        temperature: 1,
        topP: 0,
        maxTokens: 32768,
      },
    });
  });
});
