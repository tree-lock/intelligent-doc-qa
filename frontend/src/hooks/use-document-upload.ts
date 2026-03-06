import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { deleteDocuments, uploadDocuments } from "../lib/api/documents";
import { documentsQueryKey } from "./use-documents-query";

export function useDocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: uploadFiles, isPending: isUploading } = useMutation({
    mutationFn: uploadDocuments,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });

  const { mutateAsync: removeDocuments, isPending: isDeleting } = useMutation({
    mutationFn: deleteDocuments,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });

  const appendFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      void uploadFiles(files);
    },
    [uploadFiles],
  );

  const deleteByIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return;
      }
      void removeDocuments(ids);
    },
    [removeDocuments],
  );

  const onInputFilesChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      appendFiles(files);
      event.target.value = "";
    },
    [appendFiles],
  );

  const onDropFiles = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      appendFiles(Array.from(event.dataTransfer.files));
    },
    [appendFiles],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  return {
    isUploading,
    isDeleting,
    isDragging,
    fileInputRef,
    appendFiles,
    deleteByIds,
    onInputFilesChange,
    onDropFiles,
    onDragOver,
    onDragLeave,
  };
}
