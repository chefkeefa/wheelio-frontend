// Browser-facing API base. Point this at the NestJS API, including its /api prefix.
// Example: https://api.example.com/api
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8085/api").replace(/\/+$/, "");

// The car catalogue endpoint is exposed at /cars (outside /api in the current backend).
export const BACKEND_ORIGIN = API_BASE.replace(/\/api$/, "");

export function resolveApiAsset(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${BACKEND_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}
