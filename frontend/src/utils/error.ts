/**
 * 将 Error 或未知值转为用户可读的错误文案（用于 UI 展示）。
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "无法连接服务器，请检查网络或确认后端服务已启动。";
    }
    return error.message;
  }
  return "发生未知错误，请稍后重试。";
}

/**
 * 将 API 响应 payload 转为用户可见字符串（用于错误提示）。
 */
export function toErrorMessage(
  payload: unknown,
  fallbackMessage: string,
): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const parts = detail
        .map((d) => (typeof d === "string" ? d : String(d)))
        .filter(Boolean);
      if (parts.length > 0) return parts.join("；");
    }
  }
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  return fallbackMessage;
}
