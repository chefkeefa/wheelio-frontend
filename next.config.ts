// next.config.ts
import type { NextConfig } from "next";

// The API serves listing photos and answers fetch/EventSource calls from another origin (api.wheelio.lt).
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8085/api").origin;
  } catch {
    return "";
  }
}

// Security headers for every page. Scripts are limited to this site: an injected <script src> from another
// host is refused. 'unsafe-inline' stays because Next.js inlines its own bootstrap scripts (a nonce would make
// every page dynamic). Connections go only to this site, the API and the NHTSA VIN decoder used on /sell.
const api = apiOrigin();
const dev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${api}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${api} https://vpic.nhtsa.dot.gov${dev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.paysera.com https://accounts.google.com",
  ...(api.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
