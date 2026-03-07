import { useQuery } from "@tanstack/react-query";
import { fetchLLMConfigs } from "../lib/api/system";

export const llmConfigsQueryKey = ["llm-configs"] as const;

export function useLLMConfigsQuery() {
  return useQuery({
    queryKey: llmConfigsQueryKey,
    queryFn: fetchLLMConfigs,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
