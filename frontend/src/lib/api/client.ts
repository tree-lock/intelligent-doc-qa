const DEFAULT_API_BASE_URL = "http://localhost:8000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getApiBaseUrl() {
  const rawValue =
    typeof import.meta.env.VITE_API_BASE_URL === "string" &&
    import.meta.env.VITE_API_BASE_URL.trim()
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : DEFAULT_API_BASE_URL;
  return trimTrailingSlash(rawValue);
}

function buildApiUrl(path: string) {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }
  return response.text();
}

function toErrorMessage(payload: unknown, fallbackMessage: string) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  return fallbackMessage;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(
      toErrorMessage(
        payload,
        `请求失败：${response.status} ${response.statusText}`,
      ),
    );
  }

  return payload as T;
}

export { buildApiUrl, getApiBaseUrl };
