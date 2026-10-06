/**
 * Return target after sign-in or phone verification: only a path on this site.
 * Checking the resolved origin (not just a leading "/") also rejects "/\t/evil.com": browsers drop tabs and
 * newlines from URLs, which turns it into "//evil.com", another site.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || typeof window === "undefined") return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

const RETURN_KEY = "wheelio-return-after-login";

/** Keeps the return path across the Google redirect, which cannot carry it through the backend. */
export function rememberReturnPath(value: string | null | undefined) {
  try {
    if (value) sessionStorage.setItem(RETURN_KEY, value);
    else sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // storage blocked: the user lands on the home page as before
  }
}

/** The path saved by rememberReturnPath (checked like safeReturnPath), removed once read. */
export function takeReturnPath(fallback = "/"): string {
  try {
    const value = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return safeReturnPath(value, fallback);
  } catch {
    return fallback;
  }
}

/** "?return=…" for links between the sign-in pages, or "" when there is nothing to carry. */
export function returnQuery(value: string | null | undefined, prefix: "?" | "&" = "?") {
  return value && value.startsWith("/") ? `${prefix}return=${encodeURIComponent(value)}` : "";
}
