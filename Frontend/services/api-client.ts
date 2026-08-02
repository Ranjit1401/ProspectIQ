/**
 * Thin fetch wrapper around the ProspectIQ FastAPI backend.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local once the backend is deployed
 * (e.g. NEXT_PUBLIC_API_URL=https://api.prospectiq.app). Every service
 * module in this folder calls through `apiFetch` so swapping mock data
 * for live calls only requires editing the individual service file.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("prospectiq_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("prospectiq_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("prospectiq_token");
}

interface ApiFetchOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApiError(body || response.statusText, response.status);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** One parsed Server-Sent Events frame. */
export interface SseEvent {
  event: string;
  data: string;
}

/**
 * Opens a GET request against a Server-Sent Events endpoint and invokes
 * `onEvent` for every frame as it arrives. Uses `fetch` + a manual
 * ReadableStream reader rather than the native `EventSource`, because
 * `EventSource` can't send the `Authorization: Bearer <token>` header
 * this backend's auth depends on.
 *
 * Returns an `AbortController` the caller can use to cancel the stream
 * early (e.g. if the user navigates away mid-request).
 */
export function apiStream(
  path: string,
  onEvent: (event: SseEvent) => void,
  options: { onError?: (err: unknown) => void; onDone?: () => void } = {},
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const token = getToken();
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => "");
        throw new ApiError(body || response.statusText, response.status);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawFrame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let eventType = "message";
          const dataLines: string[] = [];

          for (const line of rawFrame.split("\n")) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length > 0) {
            onEvent({ event: eventType, data: dataLines.join("\n") });
          }

          boundary = buffer.indexOf("\n\n");
        }
      }

      options.onDone?.();
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      options.onError?.(err);
    }
  })();

  return controller;
}