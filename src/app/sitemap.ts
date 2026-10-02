import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getSitemapListings } from "@/lib/seo";

// Rebuilt at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["/", "/search/", "/sell/", "/about/", "/contacts/", "/rules/", "/privacy/", "/help/"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" || path === "/search/" ? "hourly" : "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
  const listings = await getSitemapListings();
  return [
    ...pages,
    ...listings.map((l) => ({
      url: `${SITE_URL}/listing/${l.id}/`,
      lastModified: l.updatedAt || l.createdAt || undefined,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
