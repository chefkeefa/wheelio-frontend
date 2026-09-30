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

// ---------------------------------------------------------------------------
// CSRF (double-submit cookie). The NestJS API rejects cookie-authenticated
// POST/PUT/PATCH/DELETE requests without a matching X-XSRF-TOKEN header.
// The XSRF-TOKEN cookie belongs to the API host, so the token is read from
// the JSON body of GET /auth/csrf (allowed only for CORS-whitelisted origins).
// ---------------------------------------------------------------------------
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfToken: string | null = null;
let csrfPending: Promise<string | null> | null = null;

async function getCsrfToken(force = false): Promise<string | null> {
  if (!force && csrfToken) return csrfToken;
  if (!csrfPending) {
    csrfPending = fetch(buildUrl("/auth/csrf"), { credentials: "include", headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { token?: unknown };
        return typeof json?.token === "string" ? json.token : null;
      })
      .catch(() => null)
      .then((token) => {
        csrfToken = token;
        csrfPending = null;
        return token;
      });
  }
  return csrfPending;
}

async function isCsrfRejection(res: Response) {
  if (res.status !== 403) return false;
  try {
    const json = (await res.clone().json()) as { message?: unknown };
    return json?.message === "Invalid CSRF token";
  } catch {
    return false;
  }
}

/**
 * fetch() for API calls: sends cookies, adds the CSRF header to state-changing
 * requests, refreshes an expired access cookie once and retries once after a
 * stale CSRF token. Also used for multipart uploads.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const unsafe = UNSAFE_METHODS.has(method);

  const send = async (forceCsrf = false) => {
    const headers = new Headers(init.headers || {});
    if (unsafe) {
      const token = await getCsrfToken(forceCsrf);
      if (token) headers.set("X-XSRF-TOKEN", token);
    }
    return fetch(url, { credentials: "include", ...init, headers });
  };

  let res = await send();
  if (unsafe && (await isCsrfRejection(res))) res = await send(true);

  // NestJS rotates HttpOnly refresh cookies. Refresh once after an expired access cookie.
  const authPath = new URL(url).pathname;
  if (res.status === 401 && !/\/auth\/(login|refresh|google)(\/|$)/.test(authPath)) {
    const token = await getCsrfToken();
    const refreshed = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", ...(token ? { "X-XSRF-TOKEN": token } : {}) },
    });
    if (refreshed.ok) res = await send();
  }
  return res;
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

    const res = await apiFetch(url, { ...rest, headers, signal: controller.signal });

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        return (text ? (JSON.parse(text) as T) : (null as T));
      }
      return (await res.json()) as T;
    }

    throw await toApiError(res);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") throw new ApiError("Request timeout", 408);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err instanceof Error ? err.message : "Network error");
  } finally {
    clearTimeout(timer);
  }
}

/** Reads a NestJS error body ({ message }) into an ApiError. */
export async function toApiError(res: Response): Promise<ApiError> {
  let message = `HTTP ${res.status}`;
  let details: unknown = undefined;
  try {
    const text = await res.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        details = json;
        const errorMessage = (json as { message?: unknown })?.message;
        if (typeof errorMessage === "string" && errorMessage) message = errorMessage;
        else if (Array.isArray(errorMessage) && typeof errorMessage[0] === "string") message = errorMessage[0];
      } catch {
        message = text || message;
      }
    }
  } catch {
    /* ignore */
  }
  return new ApiError(message, res.status, details);
}
