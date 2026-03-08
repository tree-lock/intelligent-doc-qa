import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type SendChatMessagePayload, sendChatMessageStream } from "./chat";

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
}

describe("chat api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sendChatMessageStream parses SSE and calls onChunk then onDone", async () => {
    const payload: SendChatMessagePayload = {
      message: "test",
      documents: [
        {
          id: "d1",
          name: "a.txt",
          title: "a.txt",
          plainText: "content",
          type: "txt",
          status: "ready",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };
    const sseBody =
      'data: {"content": "Hello"}\n\n' +
      'data: {"content": " world"}\n\n' +
      'data: {"done": true, "sessionId": "s1", "createdAt": "2026-01-01T00:00:00Z", "references": []}\n\n';
    vi.mocked(fetch).mockResolvedValue(
      new Response(streamFromChunks([sseBody]), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendChatMessageStream(payload, { onChunk, onDone, onError });

    expect(onError).not.toHaveBeenCalled();
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, "Hello");
    expect(onChunk).toHaveBeenNthCalledWith(2, " world");
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "s1",
        createdAt: "2026-01-01T00:00:00Z",
        references: [],
      }),
    );
  });

  it("sendChatMessageStream calls onError when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "未找到模型配置" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendChatMessageStream(
      { message: "x", documents: [] },
      { onChunk, onDone, onError },
    );

    expect(onChunk).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "未找到模型配置" }),
    );
  });

  it("sendChatMessageStream calls onError when stream sends error event", async () => {
    const sseBody = 'data: {"error": "Upstream timeout"}\n\n';
    vi.mocked(fetch).mockResolvedValue(
      new Response(streamFromChunks([sseBody]), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendChatMessageStream(
      { message: "x", documents: [] },
      { onChunk, onDone, onError },
    );

    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Upstream timeout" }),
    );
  });
});
