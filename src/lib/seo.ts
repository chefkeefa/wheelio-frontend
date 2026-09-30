// Server-side helpers for metadata and the sitemap. They never throw: if the API is unreachable,
// pages fall back to generic metadata and the sitemap lists only static pages.
import { API_BASE, resolveApiAsset } from "@/lib/config";

export type SeoListing = {
  id: number;
  title: string;
  price: number;
  description?: string | null;
  thumbnail?: string | null;
  mark?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getSeoListing(id: string): Promise<SeoListing | null> {
  if (!/^\d+$/.test(id)) return null;
  const data = await getJson<SeoListing>(`/public/listings/${id}`, 300);
  return data && typeof data === "object" && data.id ? { ...data, thumbnail: resolveApiAsset(data.thumbnail) ?? null } : null;
}

/** Active listings for sitemap.xml (the API returns at most 100 per request). */
export async function getSitemapListings(max = 5000): Promise<SeoListing[]> {
  const all: SeoListing[] = [];
  for (let offset = 0; offset < max; offset += 100) {
    const page = await getJson<SeoListing[]>(`/public/listings?limit=100&offset=${offset}`, 3600);
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < 100) break;
  }
  return all;
}
