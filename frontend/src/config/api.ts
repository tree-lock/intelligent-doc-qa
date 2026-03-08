/** 未设置 VITE_API_BASE_URL 时使用的默认值，与 .env.example 中保持一致 */
const FALLBACK_API_BASE_URL = "http://localhost:8000";

/** 当前生效的默认 API 基地址（来自环境变量或回退值），供测试或需要默认值的场景使用 */
export const DEFAULT_API_BASE_URL =
  typeof import.meta.env.VITE_API_BASE_URL === "string" &&
  import.meta.env.VITE_API_BASE_URL.trim()
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, "")
    : FALLBACK_API_BASE_URL;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const rawValue =
    typeof import.meta.env.VITE_API_BASE_URL === "string" &&
    import.meta.env.VITE_API_BASE_URL.trim()
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : FALLBACK_API_BASE_URL;
  return trimTrailingSlash(rawValue);
}
