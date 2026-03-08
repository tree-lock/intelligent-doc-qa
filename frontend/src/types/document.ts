export type DocumentItem = {
  id: string;
  name: string;
  title: string;
  plainText: string;
  type: "txt" | "markdown";
  status: "ready" | "indexing" | "failed";
  updatedAt: string;
  /** 原始上传格式（如 pdf、docx），仅 MinerU 解析的文档有值；展示时优先于 type */
  sourceFormat?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
