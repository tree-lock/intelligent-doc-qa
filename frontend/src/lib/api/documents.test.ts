import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteDocuments, fetchDocuments, uploadDocuments } from "./documents";

describe("documents api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches documents from backend", async () => {
    const responsePayload = [
      {
        id: "doc-1",
        name: "note.md",
        title: "note.md",
        plainText: "# Title\n\nBody",
        type: "markdown",
        status: "ready",
        updatedAt: "2026-03-07T10:00:00.000Z",
      },
    ];
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const documents = await fetchDocuments();
    expect(documents).toEqual(responsePayload);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/documents",
      undefined,
    );
  });

  it("uploads files with multipart/form-data", async () => {
    const mdFile = new File(["\uFEFF# Title\r\n\r\nBody"], "note.md", {
      type: "text/markdown",
    });
    const txtFile = new File(["line1\r\nline2"], "readme.txt", {
      type: "text/plain",
    });
    const responsePayload = [
      {
        id: "doc-1",
        name: "note.md",
        title: "note.md",
        plainText: "# Title\n\nBody",
        type: "markdown",
        status: "ready",
        updatedAt: "2026-03-07T10:00:00.000Z",
      },
      {
        id: "doc-2",
        name: "readme.txt",
        title: "readme.txt",
        plainText: "line1\nline2",
        type: "txt",
        status: "ready",
        updatedAt: "2026-03-07T10:01:00.000Z",
      },
    ];
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const uploaded = await uploadDocuments([mdFile, txtFile]);
    expect(uploaded).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.body).toBeInstanceOf(FormData);
  });

  it("deletes documents by ids via backend", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await deleteDocuments(["doc-1", "doc-2"]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/documents",
      expect.objectContaining({
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["doc-1", "doc-2"] }),
      }),
    );
  });
});
