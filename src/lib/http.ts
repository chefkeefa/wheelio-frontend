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
  absoluteBase: string = API_BASE,
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
  /** если true — path уже абсолютный URL */
  absolute?: boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Универсальный fetch JSON с таймаутом и аккуратными ошибками */
export async function fetchJson<T = unknown>(
  path: string,
  init: FetchJsonInit = {},
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
        // Пытаемся распарсить текст как JSON, иначе вернём null
        const text = await res.text();
        try {
          return (text ? (JSON.parse(text) as T) : (null as T));
        } catch {
          return (null as T);
        }
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
          const parsed: unknown = JSON.parse(text);
          details = parsed;
          if (isRecord(parsed) && typeof parsed.message === "string") {
            message = parsed.message;
          } else if (typeof text === "string" && text.trim().length > 0) {
            // если JSON без поля message — падать не будем, оставим HTTP-код
          }
        } catch {
          // не JSON — используем сырой текст
          if (text.trim().length > 0) message = text;
        }
      }
    } catch {
      // игнорируем ошибку чтения тела
    }

    throw new ApiError(message, res.status, details);
  } catch (err: unknown) {
    // таймаут
    if (isRecord(err) && err.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }
    if (err instanceof ApiError) throw err;

    const msg =
      (isRecord(err) && typeof err.message === "string" && err.message) || "Network error";
    throw new ApiError(msg);
  } finally {
    clearTimeout(timer);
  }
}
