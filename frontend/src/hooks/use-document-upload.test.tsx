import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentUpload } from "./use-document-upload";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../lib/api/system", () => ({
  fetchMineruTokenStatus: vi.fn(),
}));

vi.mock("../lib/api/documents", () => ({
  uploadDocuments: vi.fn(),
  deleteDocuments: vi.fn(),
  fetchDocuments: vi.fn(),
}));

const { fetchMineruTokenStatus } = await import("../lib/api/system");
const { uploadDocuments } = await import("../lib/api/documents");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe("useDocumentUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("when batch contains MinerU file and token is not configured, navigates to settings and does not upload", async () => {
    vi.mocked(fetchMineruTokenStatus).mockResolvedValue({ hasToken: false });

    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: createWrapper(),
    });

    const pdfFile = new File(["content"], "doc.pdf", {
      type: "application/pdf",
    });
    result.current.appendFiles([pdfFile]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/settings?focus=mineru");
    });
    expect(uploadDocuments).not.toHaveBeenCalled();
  });

  it("when batch contains MinerU file and token is configured, uploads files", async () => {
    vi.mocked(fetchMineruTokenStatus).mockResolvedValue({ hasToken: true });
    vi.mocked(uploadDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: createWrapper(),
    });

    const pdfFile = new File(["content"], "doc.pdf", {
      type: "application/pdf",
    });
    result.current.appendFiles([pdfFile]);

    await waitFor(() => {
      expect(uploadDocuments).toHaveBeenCalledWith(
        [pdfFile],
        expect.anything(),
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("when batch has only TXT, uploads without checking MinerU", async () => {
    vi.mocked(uploadDocuments).mockResolvedValue([]);

    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: createWrapper(),
    });

    const txtFile = new File(["text"], "readme.txt", { type: "text/plain" });
    result.current.appendFiles([txtFile]);

    await waitFor(() => {
      expect(uploadDocuments).toHaveBeenCalledWith(
        [txtFile],
        expect.anything(),
      );
    });
    expect(fetchMineruTokenStatus).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
