export const statusText = {
  ready: "可用",
  indexing: "解析中",
  failed: "失败",
} as const;

export const statusClass = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  indexing: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
} as const;
