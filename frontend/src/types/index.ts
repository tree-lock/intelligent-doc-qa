export type DocumentItem = {
  id: string;
  name: string;
  title: string;
  plainText: string;
  type: "txt" | "markdown";
  status: "ready" | "indexing" | "failed";
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
