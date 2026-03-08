export const DEFAULT_API_BASE_URL = "http://localhost:8000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const rawValue =
    typeof import.meta.env.VITE_API_BASE_URL === "string" &&
    import.meta.env.VITE_API_BASE_URL.trim()
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : DEFAULT_API_BASE_URL;
  return trimTrailingSlash(rawValue);
}
