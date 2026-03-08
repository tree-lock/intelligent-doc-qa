import type { DocumentItem } from "../types";

/**
 * 按关键词过滤文档列表，匹配 name 或 title（不区分大小写）。
 * 关键词 trim 后为空则返回原列表。
 */
export function filterDocumentsByQuery(
  documents: DocumentItem[],
  query: string,
): DocumentItem[] {
  const q = query.trim();
  if (q === "") {
    return documents;
  }
  const lower = q.toLowerCase();
  return documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(lower) ||
      doc.title.toLowerCase().includes(lower),
  );
}
