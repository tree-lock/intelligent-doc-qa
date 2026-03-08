import { useDocumentsQuery } from "../../hooks/use-documents-query";
import type { DocumentItem } from "../../types";
import { DocumentSidebar } from "./document-sidebar";

export type ChatDocumentSidebarProps = {
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

export function ChatDocumentSidebar({
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
