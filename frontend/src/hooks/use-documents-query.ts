import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchDocuments } from "../lib/api/documents";

export const documentsQueryKey = ["documents"] as const;

export function useDocumentsQuery() {
  return useSuspenseQuery({
    queryKey: documentsQueryKey,
    queryFn: fetchDocuments,
  });
}
