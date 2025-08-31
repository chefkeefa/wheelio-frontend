// src/lib/listings.ts
import { fetchJson, buildUrl } from "@/lib/http";
import { API_BASE } from "@/lib/config";

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

/** Вспомогалки */
function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function toOptStr(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function firstPreviewUrl(rec: Record<string, unknown>): string | undefined {
  const ids = rec["imageIds"];
  if (Array.isArray(ids) && ids.length > 0) {
    const raw = ids[0];
    const idNum = Number(raw);
    if (Number.isFinite(idNum)) return `${API_BASE}/db/images/${idNum}/preview`;
  }
  return undefined;
}

function normalizeList(input: unknown): Listing[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, i): Listing => {
    const r = asRecord(item);
    const thumb = toOptStr(r["thumbnail"]) ?? firstPreviewUrl(r);
    const idRaw = r["id"];
    const id = idRaw === undefined || idRaw === null ? String(i + 1) : String(idRaw);
    return {
      id,
      title: toStr(r["title"], "Text text text"),
      price: toNum(r["price"], 0),
      mileage: toNum(r["mileage"], 0),
      thumbnail: thumb,
    };
  });
}

function normalizeDetail(x: unknown): ListingDetail {
  const r = asRecord(x);
  const thumb = toOptStr(r["thumbnail"]) ?? firstPreviewUrl(r);
  const images = Array.isArray(r["images"])
    ? (r["images"] as unknown[]).filter((s): s is string => typeof s === "string")
    : [];

  return {
    id: toStr(r["id"], ""),
    title: toStr(r["title"], "Text text text"),
    price: toNum(r["price"], 0),
    mileage: toNum(r["mileage"], 0),
    thumbnail: thumb,
    description: toOptStr(r["description"]),
    images,
  };
}

export async function getPublicListings(query: ListingsQuery = {}): Promise<Listing[]> {
  const url = buildUrl(PUBLIC, query);
  const data = await fetchJson<unknown>(url, { method: "GET", absolute: false });
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)["data"])
    ? (asRecord(data)["data"] as unknown[])
    : [];
  return normalizeList(arr);
}

export async function getListingById(id: string): Promise<ListingDetail | null> {
  if (!id) return null;
  const url = buildUrl(`${PUBLIC}/${encodeURIComponent(id)}`);
  const raw = await fetchJson<unknown>(url, { method: "GET", absolute: false });
  if (!raw) return null;
  const payload = asRecord(raw)["data"] ?? raw;
  return normalizeDetail(payload);
}

export async function createListing(payload: Partial<ListingDetail>): Promise<ListingDetail> {
  const data = await fetchJson<unknown>(`${PRIVATE}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return normalizeDetail(data);
}

export async function editListing(id: string, payload: Partial<ListingDetail>): Promise<ListingDetail> {
  const data = await fetchJson<unknown>(`${PRIVATE}/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return normalizeDetail(data);
}
