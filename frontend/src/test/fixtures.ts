import type { DocumentItem } from "../types";

export const testDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    name: "高数知识点汇总.md",
    title: "高数知识点汇总.md",
    plainText: "这是用于演示的文档内容。",
    type: "markdown",
    status: "ready",
    updatedAt: "2026-03-06 10:12",
  },
  {
    id: "doc-2",
    name: "英语阅读长难句.txt",
    title: "英语阅读长难句.txt",
    plainText: "这是用于演示的文档内容。",
    type: "txt",
    status: "indexing",
    updatedAt: "2026-03-06 09:44",
  },
  {
    id: "doc-3",
    name: "面试题复盘.md",
    title: "面试题复盘.md",
    plainText: "这是用于演示的文档内容。",
    type: "markdown",
    status: "failed",
    updatedAt: "2026-03-05 21:08",
  },
];
