import { Suspense, useState } from "react";
import { ChatInput } from "../components/chat/chat-input";
import { DocumentSidebar } from "../components/chat/document-sidebar";
import { MessageList } from "../components/chat/message-list";
import { LoadingPanel } from "../components/ui/loading-panel";
import { useChatInput } from "../hooks/use-chat-input";
import { useDocumentSelection } from "../hooks/use-document-selection";
import { useDocumentsQuery } from "../hooks/use-documents-query";
import { NEW_CHAT_ID } from "../lib/chat-sessions";
import type { ChatMessage, DocumentItem } from "../types";

type ChatPageProps = {
  chatId: string;
  messages: ChatMessage[];
  loadedDocuments: DocumentItem[];
  pendingDocuments: DocumentItem[];
  onSendMessage: (content: string) => Promise<void>;
  isSendingMessage: boolean;
  onPendingDocumentsChange: (documents: DocumentItem[]) => void;
};

export function ChatPage({
  chatId,
  messages,
  loadedDocuments,
  pendingDocuments,
  onSendMessage,
  isSendingMessage,
  onPendingDocumentsChange,
}: ChatPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    selectedDocumentIds,
    setSelectedDocumentIds,
    loadedDocumentIdSet,
    selectedDocuments,
    selectedCount,
    toggleDocumentSelection,
  } = useDocumentSelection(loadedDocuments, pendingDocuments);

  const { inputValue, setInputValue, submitMessage, onTextareaKeyDown } =
    useChatInput(onSendMessage, isSendingMessage);

  return (
    <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-6xl grid-cols-12 gap-4">
      <Suspense
        fallback={
          <div className="col-span-3">
            <LoadingPanel
              title="文档加载中"
              description="正在同步文档管理中的文档..."
            />
          </div>
        }
      >
        <ChatDocumentSidebar
          chatId={chatId}
          loadedDocuments={loadedDocuments}
          loadedDocumentIdSet={loadedDocumentIdSet}
          selectedDocuments={selectedDocuments}
          selectedDocumentIds={selectedDocumentIds}
          selectedCount={selectedCount}
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          toggleDocumentSelection={toggleDocumentSelection}
          setSelectedDocumentIds={setSelectedDocumentIds}
          onPendingDocumentsChange={onPendingDocumentsChange}
        />
      </Suspense>

      <section className="col-span-9 flex flex-col rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-sm font-medium text-slate-900">Agent 问答</h1>
          <p className="mt-1 text-xs text-slate-500">
            会话 ID：
            {chatId === NEW_CHAT_ID ? "new（发送首条消息后生成）" : chatId}
          </p>
        </header>

        <MessageList messages={messages} />

        <footer className="border-t border-slate-200 p-4">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={submitMessage}
            onKeyDown={onTextareaKeyDown}
            isSubmitting={isSendingMessage}
          />
        </footer>
      </section>
    </div>
  );
}

type ChatDocumentSidebarProps = {
  chatId: string;
  loadedDocuments: DocumentItem[];
  loadedDocumentIdSet: Set<string>;
  selectedDocuments: DocumentItem[];
  selectedDocumentIds: string[];
  selectedCount: number;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  toggleDocumentSelection: (id: string, checked: boolean) => void;
  setSelectedDocumentIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
  onPendingDocumentsChange: (documents: DocumentItem[]) => void;
};

function ChatDocumentSidebar({
  chatId,
  loadedDocuments,
  loadedDocumentIdSet,
  selectedDocuments,
  selectedDocumentIds,
  selectedCount,
  isAddDialogOpen,
  setIsAddDialogOpen,
  toggleDocumentSelection,
  setSelectedDocumentIds,
  onPendingDocumentsChange,
}: ChatDocumentSidebarProps) {
  const { data: allDocuments } = useDocumentsQuery();

  const addSelectedDocuments = () => {
    const nextDocuments = allDocuments.filter(
      (document) =>
        selectedDocumentIds.includes(document.id) &&
        !loadedDocumentIdSet.has(document.id),
    );
    onPendingDocumentsChange(nextDocuments);
    setIsAddDialogOpen(false);
  };

  return (
    <DocumentSidebar
      chatId={chatId}
      loadedDocuments={loadedDocuments}
      allDocuments={allDocuments}
      loadedDocumentIdSet={loadedDocumentIdSet}
      selectedDocuments={selectedDocuments}
      selectedDocumentIds={selectedDocumentIds}
      selectedCount={selectedCount}
      isAddDialogOpen={isAddDialogOpen}
      onDialogOpenChange={setIsAddDialogOpen}
      onToggle={toggleDocumentSelection}
      onSave={addSelectedDocuments}
      setSelectedDocumentIds={setSelectedDocumentIds}
    />
  );
}
