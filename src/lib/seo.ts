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

export type SeoListingDetail = SeoListing & {
  images?: string[] | null;
  city?: string | null;
  status?: string | null;
  fuel?: string | null;
  transmission?: string | null;
};

export async function getSeoListingDetail(id: string): Promise<SeoListingDetail | null> {
  if (!/^\d+$/.test(id)) return null;
  const data = await getJson<SeoListingDetail>(`/public/listings/${id}`, 300);
  if (!data || typeof data !== "object" || !data.id) return null;
  return {
    ...data,
    thumbnail: resolveApiAsset(data.thumbnail) ?? null,
    images: Array.isArray(data.images) ? data.images.map((i) => resolveApiAsset(i)).filter((i): i is string => !!i) : null,
  };
}

/** Site-wide search texts. Lithuanian first: wheelio.lt is indexed in Lithuanian. */
export const SITE_NAME = "Wheelio";
export const SITE_TITLE = "Wheelio – automobilių skelbimai: pirkite ir parduokite automobilį";
export const SITE_DESCRIPTION =
  "Wheelio automobilių skelbimai Lietuvoje ir Baltijos šalyse. Naudoti ir nauji automobiliai: ieškokite pagal markę, modelį, metus, kainą ir miestą arba įdėkite savo automobilio skelbimą.";
export const SITE_KEYWORDS = [
  "wheelio",
  "wheelio.lt",
  "automobilių skelbimai",
  "automobiliu skelbimai",
  "auto skelbimai",
  "naudoti automobiliai",
  "automobiliai pardavimui",
  "parduoti automobilį",
  "pirkti automobilį",
  "automobilių turgus",
  "skelbimai Lietuvoje",
];
export const DEFAULT_OG_IMAGE = "/images/hero.jpg";
