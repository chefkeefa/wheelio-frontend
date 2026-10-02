// next.config.ts
import type { NextConfig } from "next";

// Security headers for every page. The Content-Security-Policy only covers what cannot break the site
// (framing, plugins, <base> and form targets); scripts and styles are not restricted because Next.js
// inlines its own bootstrap scripts.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://www.paysera.com https://accounts.google.com",
  },
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
