import { ApiError, buildUrl, fetchJson } from "@/lib/http";
import { resolveApiAsset } from "@/lib/config";

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
  createdAt?: string;
  updatedAt?: string;
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
  doors?: string;
  transmission?: string;
  category?: string;
  fuel?: string;
  powerMin?: number;
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

export async function getMyListings(page = 0, size = 24): Promise<PageResponse<Listing>> {
  const data = await fetchJson<Partial<PageResponse<unknown>>>(`${PRIVATE}/mine?page=${page}&size=${size}`);
  const content = normalizeList(Array.isArray(data?.content) ? data.content : []);
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

export async function updateListingStatus(id: string, status: ListingStatus) {
  return fetchJson<void>(`${PRIVATE}/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
