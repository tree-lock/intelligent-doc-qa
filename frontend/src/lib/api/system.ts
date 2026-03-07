import type {
  LLMConfig,
  LLMConfigConnectivityTestInput,
  LLMConfigConnectivityTestResult,
  LLMConfigCreateInput,
  LLMConfigUpdateInput,
} from "../system-settings";
import { apiFetch } from "./client";

export type ProviderListResponse = {
  items: string[];
};

export type LLMConfigListResponse = {
  items: LLMConfig[];
};

export async function fetchLLMConfigs(): Promise<LLMConfig[]> {
  const response = await apiFetch<LLMConfigListResponse>(
    "/api/v1/system/llm-configs",
  );
  return response.items;
}

export async function createLLMConfig(
  payload: LLMConfigCreateInput,
): Promise<LLMConfig> {
  return apiFetch<LLMConfig>("/api/v1/system/llm-configs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateLLMConfig(
  configId: string,
  payload: LLMConfigUpdateInput,
): Promise<LLMConfig> {
  return apiFetch<LLMConfig>(`/api/v1/system/llm-configs/${configId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteLLMConfig(configId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/system/llm-configs/${configId}`, {
    method: "DELETE",
  });
}

export async function fetchProviders(): Promise<string[]> {
  const response = await apiFetch<ProviderListResponse>(
    "/api/v1/system/providers",
  );
  return response.items;
}

export async function testLLMConfigConnectivity(
  payload: LLMConfigConnectivityTestInput,
): Promise<LLMConfigConnectivityTestResult> {
  return apiFetch<LLMConfigConnectivityTestResult>(
    "/api/v1/system/llm-configs/test",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export type MineruTokenStatus = {
  hasToken: boolean;
};

export async function fetchMineruTokenStatus(): Promise<MineruTokenStatus> {
  return apiFetch<MineruTokenStatus>("/api/v1/system/mineru-token");
}

export async function updateMineruToken(token: string | null): Promise<void> {
  await apiFetch<void>("/api/v1/system/mineru-token", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
}
