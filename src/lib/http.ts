// src/lib/http.ts
import { API_BASE } from "./config";

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/** Собираем абсолютный URL из BASE + path + query */
export function buildUrl(
  path: string,
  params?: Record<string, unknown>,
  absoluteBase: string = API_BASE
) {
  const base = absoluteBase.endsWith("/") ? absoluteBase : absoluteBase + "/";
  const safePath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(base + safePath);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

type FetchJsonInit = RequestInit & {
  timeoutMs?: number;
  absolute?: boolean; // если true — path уже абсолютный URL
};

/** Универсальный fetch JSON с таймаутом и аккуратными ошибками */
export async function fetchJson<T = unknown>(
  path: string,
  init: FetchJsonInit = {}
): Promise<T> {
  const { timeoutMs = 15000, absolute = false, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = absolute ? path : buildUrl(path);
    const headers = new Headers(rest.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (rest.body && !(rest.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, { ...rest, headers, signal: controller.signal });

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        return (text ? (JSON.parse(text) as T) : (null as T));
      }
      return (await res.json()) as T;
    }

    // читаем тело ошибки
    let message = `HTTP ${res.status}`;
    let details: unknown = undefined;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          details = json;
          message = (json as any)?.message || message;
        } catch {
          message = text || message;
        }
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status, details);
  } catch (err: any) {
    if (err?.name === "AbortError") throw new ApiError("Request timeout", 408);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || "Network error");
  } finally {
    clearTimeout(timer);
  }
}
