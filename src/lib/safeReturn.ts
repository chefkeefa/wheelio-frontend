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
