import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { documentsQueryKey } from "../hooks/use-documents-query";
import { NEW_CHAT_ID } from "../lib/chat-sessions";
import { testDocuments } from "../test/fixtures";
import { ChatPage } from "./chat-page";

afterEach(() => {
  cleanup();
});

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  queryClient.setQueryData(documentsQueryKey, testDocuments);
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("ChatPage document states", () => {
  it("shows pending state as not-loaded in new chat", () => {
    const onPendingDocumentsChange = vi.fn();

    renderWithQueryClient(
      <ChatPage
        chatId={NEW_CHAT_ID}
        messages={[]}
        loadedDocuments={[]}
        pendingDocuments={[testDocuments[0]]}
        onSendMessage={vi.fn(async () => {})}
        isSendingMessage={false}
        onPendingDocumentsChange={onPendingDocumentsChange}
      />,
    );

    expect(screen.queryByText("已选中（下轮生效）")).toBeNull();
    expect(screen.queryByText("已加载")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "修改文档" }));
    const pendingCheckbox = screen.getByRole("checkbox", {
      name: new RegExp(testDocuments[0].name),
    });
    expect(pendingCheckbox.hasAttribute("disabled")).toBe(false);
  });

  it("locks loaded docs and allows editing only pending docs", () => {
    const onPendingDocumentsChange = vi.fn();

    renderWithQueryClient(
      <ChatPage
        chatId="chat-1"
        messages={[]}
        loadedDocuments={[testDocuments[0]]}
        pendingDocuments={[testDocuments[1]]}
        onSendMessage={vi.fn(async () => {})}
        isSendingMessage={false}
        onPendingDocumentsChange={onPendingDocumentsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "修改文档" }));

    const loadedCheckbox = screen.getByRole("checkbox", {
      name: new RegExp(testDocuments[0].name),
    });
    const pendingCheckbox = screen.getByRole("checkbox", {
      name: new RegExp(testDocuments[1].name),
    });
    const unselectedCheckbox = screen.getByRole("checkbox", {
      name: new RegExp(testDocuments[2].name),
    });

    expect(loadedCheckbox.hasAttribute("disabled")).toBe(true);
    expect(pendingCheckbox.hasAttribute("disabled")).toBe(false);
    expect(unselectedCheckbox.hasAttribute("disabled")).toBe(false);

    fireEvent.click(pendingCheckbox);
    fireEvent.click(unselectedCheckbox);
    fireEvent.click(screen.getByRole("button", { name: "保存文档选择" }));

    expect(onPendingDocumentsChange).toHaveBeenCalledTimes(1);
    expect(
      onPendingDocumentsChange.mock.calls[0]?.[0].map(
        (document: { id: string }) => document.id,
      ),
    ).toEqual([testDocuments[2].id]);
  });
});

describe("ChatPage input submit behavior", () => {
  it("does not submit when Enter is used during IME composition", () => {
    const onSendMessage = vi.fn();

    renderWithQueryClient(
      <ChatPage
        chatId={NEW_CHAT_ID}
        messages={[]}
        loadedDocuments={[]}
        pendingDocuments={[]}
        onSendMessage={async (content) => {
          onSendMessage(content);
        }}
        isSendingMessage={false}
        onPendingDocumentsChange={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      "继续追问，或输入新的学习目标...",
    );
    fireEvent.change(textarea, { target: { value: "nihao" } });

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      keyCode: 229,
      which: 229,
    });

    expect(onSendMessage).not.toHaveBeenCalled();
    expect((textarea as HTMLTextAreaElement).value).toBe("nihao");
  });

  it("submits on plain Enter and clears textarea", () => {
    const onSendMessage = vi.fn();

    renderWithQueryClient(
      <ChatPage
        chatId={NEW_CHAT_ID}
        messages={[]}
        loadedDocuments={[]}
        pendingDocuments={[]}
        onSendMessage={async (content) => {
          onSendMessage(content);
        }}
        isSendingMessage={false}
        onPendingDocumentsChange={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      "继续追问，或输入新的学习目标...",
    );
    fireEvent.change(textarea, { target: { value: "hello" } });

    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
    });

    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledWith("hello");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });
});
