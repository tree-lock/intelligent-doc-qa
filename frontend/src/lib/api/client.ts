import { getApiBaseUrl } from "../../config/api";
import { toErrorMessage } from "../../utils/error";

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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown;
  if (!response.ok) {
    try {
      payload = await parseResponseBody(response);
    } catch {
      payload = null;
    }
    const fallback = `请求失败：${response.status} ${response.statusText}`;
    throw new Error(toErrorMessage(payload, fallback));
  }

  payload = await parseResponseBody(response);
  return payload as T;
}

export { getApiBaseUrl } from "../../config/api";
export { buildApiUrl };
