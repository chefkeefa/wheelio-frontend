import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Nothing is blocked: private pages carry a noindex tag instead. Google never reads that tag on a blocked
      // page, so a blocked URL linked from the header (/auth/login/) still got indexed without its content.
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
