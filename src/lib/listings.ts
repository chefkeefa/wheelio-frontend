import { ApiError, buildUrl, fetchJson } from "@/lib/http";
import { resolveApiAsset } from "@/lib/config";
import type { CarSpecs } from "@/lib/carSpecs";

export type ListingStatus = "ACTIVE" | "SOLD" | "CLOSED" | "PENDING_PAYMENT";

export type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
  status?: ListingStatus;
  mark?: string;
  model?: string;
  year?: number;
  /** Engine volume in litres. */
  volume?: number;
  /** Power in kW. */
  power?: number;
  transmission?: string;
  fuel?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ListingDetail = Listing & {
  description?: string;
  images?: string[];
  /** Catalog specifications of the car's version (detail endpoint only). */
  specs?: CarSpecs | null;
  /** Equipment option keys (see lib/carOptions). */
  options?: string[];
  /** "seller" when the seller chose the list, "catalog" for the version's factory equipment. */
  optionsSource?: "seller" | "catalog" | null;
};

export type ListingsQuery = {
  mark?: string;
  model?: string;
  city?: string;
  /** Exact year; older links only. */
  reg?: string;
  yearMin?: number;
  yearMax?: number;
  /** Maximum mileage, km. */
  mileage?: string | number;
  priceMin?: number;
  priceMax?: number;
  doors?: string;
  transmission?: string;
  /** FULL, FRONT or REAR. */
  drive?: string;
  category?: string;
  fuel?: string;
  /** Power in kW. */
  powerMin?: number;
  powerMax?: number;
  /** Engine volume in litres. */
  volumeMin?: number;
  volumeMax?: number;
  withPhoto?: "1";
  limit?: number;
  offset?: number;
  sort?: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
};

const PUBLIC = "/public/listings";
const PRIVATE = "/listings";

type RawListing = Record<string, unknown>;

function normalizeListing(x: RawListing, fallbackId?: number): Listing {
  return {
    id: String(x?.id ?? fallbackId ?? ""),
    title: String(x?.title ?? "Wheelio"),
    price: Number.isFinite(Number(x?.price)) ? Number(x?.price) : 0,
    mileage: Number.isFinite(Number(x?.mileage)) ? Number(x?.mileage) : 0,
    thumbnail: resolveApiAsset(typeof x?.thumbnail === "string" ? x.thumbnail : undefined),
    status:
      x?.status === "ACTIVE" ||
      x?.status === "SOLD" ||
      x?.status === "CLOSED" ||
      x?.status === "PENDING_PAYMENT"
        ? x.status
        : undefined,
    mark: typeof x?.mark === "string" ? x.mark : undefined,
    model: typeof x?.model === "string" ? x.model : undefined,
    year: Number.isFinite(Number(x?.year)) ? Number(x?.year) : undefined,
    volume: Number(x?.volume) > 0 ? Number(x?.volume) : undefined,
    power: Number(x?.power) > 0 ? Number(x?.power) : undefined,
    transmission: typeof x?.transmission === "string" && x.transmission ? x.transmission : undefined,
    fuel: typeof x?.fuel === "string" && x.fuel ? x.fuel : undefined,
    city: typeof x?.city === "string" && x.city ? x.city : undefined,
    createdAt: typeof x?.createdAt === "string" ? x.createdAt : undefined,
    updatedAt: typeof x?.updatedAt === "string" ? x.updatedAt : undefined,
  };
}

function normalizeList(input: unknown): Listing[] {
  if (!Array.isArray(input)) return [];
  return input.map((x: unknown, i: number) => normalizeListing((x && typeof x === "object" ? x : {}) as RawListing, i + 1));
}

function normalizeDetail(x: RawListing): ListingDetail {
  return {
    ...normalizeListing(x),
    description:
      typeof x?.description === "string" ? x.description : undefined,
    images: Array.isArray(x?.images)
      ? x.images.filter((s: unknown): s is string => typeof s === "string" && Boolean(s)).map((s) => resolveApiAsset(s)!)
      : [],
    specs: x?.specs && typeof x.specs === "object" ? (x.specs as CarSpecs) : null,
    options: Array.isArray(x?.options) ? x.options.filter((k: unknown): k is string => typeof k === "string") : [],
    optionsSource: x?.optionsSource === "seller" || x?.optionsSource === "catalog" ? x.optionsSource : null,
  };
}

export async function getPublicListings(
  query: ListingsQuery = {}
): Promise<Listing[]> {
  const url = buildUrl(PUBLIC, query);
  const data = await fetchJson<unknown>(url, {
    method: "GET",
    absolute: true,
  });

  const wrapped = data && typeof data === "object" && "data" in data
    ? (data as { data?: unknown }).data
    : undefined;
  const arr = Array.isArray(data) ? data : Array.isArray(wrapped) ? wrapped : [];

  return normalizeList(arr);
}

export async function getPublicListingCount(query: Omit<ListingsQuery, "limit" | "offset" | "sort"> = {}): Promise<number> {
  const url = buildUrl(`${PUBLIC}/count`, query);
  const data = await fetchJson<{ count?: unknown }>(url, { method: "GET", absolute: true });
  const count = Number(data?.count);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

export async function getListingById(
  id: string
): Promise<ListingDetail | null> {
  const normalizedId = String(id ?? "").trim();
  if (!/^\d+$/.test(normalizedId)) return null;

  try {
    const url = buildUrl(`${PUBLIC}/${encodeURIComponent(normalizedId)}`);
    const raw = await fetchJson<unknown>(url, {
      method: "GET",
      absolute: true,
    });
    const object = raw && typeof raw === "object" ? raw as RawListing : null;
    const detail = object && "data" in object ? object.data : object;
    return detail && typeof detail === "object" ? normalizeDetail(detail as RawListing) : null;
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 404)
    ) {
      return null;
    }
    throw error;
  }
}

export async function getMyListings(page = 0, size = 24): Promise<PageResponse<ListingDetail>> {
  const data = await fetchJson<Partial<PageResponse<unknown>>>(`${PRIVATE}/mine?page=${page}&size=${size}`);
  const content = (Array.isArray(data?.content) ? data.content : []).map((x, i) =>
    normalizeDetail({ id: i + 1, ...((x && typeof x === "object" ? x : {}) as RawListing) })
  );
  return {
    content,
    totalElements: Number(data?.totalElements ?? content.length),
    totalPages: Number(data?.totalPages ?? 1),
    number: Number(data?.number ?? page),
    size: Number(data?.size ?? size),
    first: Boolean(data?.first),
    last: Boolean(data?.last),
  };
}

/** Owner takes a listing down: sold = SOLD, otherwise CLOSED. (The edit route rejects status changes.) */
export async function closeListing(id: string, sold: boolean) {
  return fetchJson<{ success: boolean; status: ListingStatus }>(`${PRIVATE}/${encodeURIComponent(id)}/close`, {
    method: "POST",
    body: JSON.stringify({ sold }),
  });
}

export async function editListing(id: string, changes: { price?: number; description?: string }) {
  return fetchJson<{ success: boolean }>(`${PRIVATE}/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify(changes),
  });
}

/** Deletes the photo at `index` (position in the listing's image list). */
export async function deleteListingImage(id: string, index: number) {
  return fetchJson<{ success: boolean }>(`${PRIVATE}/${encodeURIComponent(id)}/images/${index}`, { method: "DELETE" });
}

export async function getFavorites(): Promise<Listing[]> {
  return normalizeList(await fetchJson<unknown>("/favorites"));
}
