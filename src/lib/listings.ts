// src/lib/listings.ts
import { fetchJson, buildUrl } from "@/lib/http"; // <— алиас вместо ./http

export type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
};

export type ListingDetail = Listing & {
  description?: string;
  images?: string[];
};

export type ListingsQuery = {
  mark?: string;
  model?: string;
  reg?: string;
  mileage?: string | number;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
  sort?: string;
};

const PUBLIC = "/public/listings";
const PRIVATE = "/listings";

function normalizeList(input: unknown): Listing[] {
  if (!Array.isArray(input)) return [];
  return input.map((x: any, i: number) => ({
    id: String(x?.id ?? i + 1),
    title: String(x?.title ?? "Text text text"),
    price: Number.isFinite(Number(x?.price)) ? Number(x?.price) : 0,
    mileage: Number.isFinite(Number(x?.mileage)) ? Number(x?.mileage) : 0,
    thumbnail: typeof x?.thumbnail === "string" && x.thumbnail ? x.thumbnail : undefined,
  }));
}

function normalizeDetail(x: any): ListingDetail {
  return {
    id: String(x?.id ?? ""),
    title: String(x?.title ?? "Text text text"),
    price: Number.isFinite(Number(x?.price)) ? Number(x?.price) : 0,
    mileage: Number.isFinite(Number(x?.mileage)) ? Number(x?.mileage) : 0,
    thumbnail: typeof x?.thumbnail === "string" && x.thumbnail ? x.thumbnail : undefined,
    description: typeof x?.description === "string" ? x.description : undefined,
    images: Array.isArray(x?.images) ? x.images.filter((s: any) => typeof s === "string") : [],
  };
}

export async function getPublicListings(query: ListingsQuery = {}): Promise<Listing[]> {
  const url = buildUrl(PUBLIC, query);
  const data = await fetchJson<any>(url, { method: "GET", absolute: false });
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return normalizeList(arr);
}

export async function getListingById(id: string): Promise<ListingDetail | null> {
  if (!id) return null;
  const url = buildUrl(`${PUBLIC}/${encodeURIComponent(id)}`);
  const raw = await fetchJson<any>(url, { method: "GET", absolute: false });
  if (!raw) return null;
  return normalizeDetail(raw?.data ?? raw);
}

export async function createListing(payload: Partial<ListingDetail>): Promise<ListingDetail> {
  const data = await fetchJson<any>(`${PRIVATE}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeDetail(data);
}

export async function editListing(id: string, payload: Partial<ListingDetail>): Promise<ListingDetail> {
  const data = await fetchJson<any>(`${PRIVATE}/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeDetail(data);
}
