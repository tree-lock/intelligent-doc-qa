import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { APP_ROUTE_PATH } from "../app/route-config";
import { deleteDocuments, uploadDocuments } from "../lib/api/documents";
import { fetchMineruTokenStatus } from "../lib/api/system";
import { isMineruSupportedFile, MINERU_REQUIRED_MESSAGE } from "../lib/mineru";
import { documentsQueryKey } from "./use-documents-query";

export function useDocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: uploadFiles, isPending: isUploading } = useMutation({
    mutationFn: uploadDocuments,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "文档上传失败，请稍后重试";
      toast.error(message, { duration: Infinity });
    },
  });

  const { mutateAsync: removeDocuments, isPending: isDeleting } = useMutation({
    mutationFn: deleteDocuments,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "文档删除失败，请稍后重试";
      toast.error(message, { duration: Infinity });
    },
  });

  const appendFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      const hasMineruFile = files.some((f) => isMineruSupportedFile(f.name));
      if (hasMineruFile) {
        try {
          const status = await fetchMineruTokenStatus();
          if (!status.hasToken) {
            toast.warning(MINERU_REQUIRED_MESSAGE);
            navigate(`${APP_ROUTE_PATH.settings}?focus=mineru`);
            return;
          }
        } catch {
          toast.error("无法获取 MinerU 配置状态，请稍后重试");
          return;
        }
      }
      void uploadFiles(files);
    },
    [navigate, uploadFiles],
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
