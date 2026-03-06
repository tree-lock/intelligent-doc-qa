import { useCallback, useMemo, useState } from "react";
import type { DocumentItem } from "../types";

/**
 * Manages document selection for chat context where loaded documents are locked.
 */
export function useDocumentSelection(
  loadedDocuments: DocumentItem[],
  pendingDocuments: DocumentItem[],
) {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const loadedDocumentIdSet = useMemo(
    () => new Set(loadedDocuments.map((d) => d.id)),
    [loadedDocuments],
  );

  const selectedDocuments = useMemo(() => {
    const map = new Map<string, DocumentItem>();
    for (const doc of loadedDocuments) {
      map.set(doc.id, doc);
    }
    for (const doc of pendingDocuments) {
      if (!map.has(doc.id)) {
        map.set(doc.id, doc);
      }
    }
    return Array.from(map.values());
  }, [loadedDocuments, pendingDocuments]);

  const selectedCount = selectedDocuments.length;

  const toggleDocumentSelection = useCallback(
    (id: string, checked: boolean) => {
      if (loadedDocumentIdSet.has(id)) {
        return;
      }
      setSelectedDocumentIds((prev) => {
        if (checked) {
          return prev.includes(id) ? prev : [...prev, id];
        }
        return prev.filter((item) => item !== id);
      });
    },
    [loadedDocumentIdSet],
  );

  return {
    selectedDocumentIds,
    setSelectedDocumentIds,
    loadedDocumentIdSet,
    selectedDocuments,
    selectedCount,
    toggleDocumentSelection,
  };
}
