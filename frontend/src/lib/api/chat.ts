import type {
  SendChatMessagePayload,
  SendChatMessageResult,
  SendChatMessageStreamCallbacks,
} from "../../types";
import { apiFetch, buildApiUrl } from "./client";

export type {
  SendChatMessagePayload,
  SendChatMessageResult,
  SendChatMessageStreamCallbacks,
  StreamDoneMeta,
} from "../../types";

export async function sendChatMessage(
  payload: SendChatMessagePayload,
): Promise<SendChatMessageResult> {
  return apiFetch<SendChatMessageResult>("/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type SendChatMessageStreamOptions = {
  signal?: AbortSignal;
};

export async function sendChatMessageStream(
  payload: SendChatMessagePayload,
  callbacks: SendChatMessageStreamCallbacks,
  options?: SendChatMessageStreamOptions,
): Promise<void> {
  const { signal } = options ?? {};
  const response = await fetch(buildApiUrl("/api/v1/chat/completions/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = `请求失败：${response.status} ${response.statusText}`;
    if (contentType.includes("application/json")) {
      try {
        const body = (await response.json()) as { detail?: string };
        if (typeof body.detail === "string" && body.detail.trim()) {
          message = body.detail;
        }
      } catch {
        // use default message
      }
    }
    callbacks.onError(new Error(message));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("响应体不可读"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        callbacks.onError(new Error("请求已取消"));
        return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) {
        callbacks.onError(new Error("请求已取消"));
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data) as {
            content?: string;
            done?: boolean;
            error?: string;
            sessionId?: string;
            createdAt?: string;
            references?: string[];
            modelConfigId?: string;
            provider?: string;
            modelName?: string;
          };
          if (event.error) {
            callbacks.onError(new Error(event.error));
            return;
          }
          if (event.content !== undefined) {
            callbacks.onChunk(event.content);
          }
          if (event.done === true) {
            callbacks.onDone({
              sessionId: event.sessionId,
              createdAt: event.createdAt,
              references: event.references,
              modelConfigId: event.modelConfigId,
              provider: event.provider,
              modelName: event.modelName,
            });
          }
        } catch {
          // skip malformed line
        }
      }
    }
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6).trim();
        if (data) {
          try {
            const event = JSON.parse(data) as {
              content?: string;
              done?: boolean;
              error?: string;
              sessionId?: string;
              createdAt?: string;
              references?: string[];
              modelConfigId?: string;
              provider?: string;
              modelName?: string;
            };
            if (event.error) {
              callbacks.onError(new Error(event.error));
              return;
            }
            if (event.content !== undefined) {
              callbacks.onChunk(event.content);
            }
            if (event.done === true) {
              callbacks.onDone({
                sessionId: event.sessionId,
                createdAt: event.createdAt,
                references: event.references,
                modelConfigId: event.modelConfigId,
                provider: event.provider,
                modelName: event.modelName,
              });
            }
          } catch {
            // skip
          }
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
