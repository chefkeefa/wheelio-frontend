import { ApiError, apiFetch, buildUrl, fetchJson, toApiError } from "@/lib/http";
import { resolveApiAsset } from "@/lib/config";
import { normalizeListings, type Listing, type ListingStatus } from "@/lib/listings";

export type PublicProfile = {
  id: number;
  /** First name and the surname's initial, e.g. "Piotr K." */
  name: string;
  avatarUrl: string | null;
  /** Set by Wheelio after checking an ID document. */
  identityVerified: boolean;
  memberSince: string | null;
  activeListings: number;
  soldListings: number;
  /** A phone number can be revealed (signed-in visitors, sellers with an active listing). */
  hasPhone: boolean;
  /** The signed-in visitor is this user. */
  own: boolean;
};

/** null when the user does not exist or is blocked. */
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const p = await fetchJson<PublicProfile>(`/public/users/${id}`);
    return { ...p, avatarUrl: resolveApiAsset(p.avatarUrl) ?? null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getPublicProfileListings(id: string): Promise<Listing[]> {
  return normalizeListings(await fetchJson<unknown>(`/public/users/${id}/listings?limit=100`));
}

export function getProfileContact(id: string | number) {
  return fetchJson<{ phone: string | null }>(`/public/users/${id}/contact`);
}

export async function uploadAvatar(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch(buildUrl("/users/me/avatar"), { method: "POST", body: form });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { avatarUrl: string | null };
  return resolveApiAsset(body.avatarUrl) ?? null;
}

export function deleteAvatar() {
  return fetchJson<{ avatarUrl: null }>("/users/me/avatar", { method: "DELETE" });
}

// ---- Listing statistics (owner only) ----
export type ListingTotals = { views: number; contactViews: number; favorites: number; chats: number };
export type ListingStats = ListingTotals & {
  listingId: number;
  createdAt: string | null;
  last7Views: number;
  days: { day: string; views: number; contactViews: number }[];
};

export function getListingStats(id: string | number) {
  return fetchJson<ListingStats>(`/listings/${id}/stats`);
}

/** Totals for every own listing, keyed by listing id; empty when the backend has no statistics yet. */
export async function getMyListingsStats(): Promise<Record<string, ListingTotals>> {
  try {
    const rows = await fetchJson<(ListingTotals & { listingId: number })[]>("/listings/mine/stats");
    return Object.fromEntries((Array.isArray(rows) ? rows : []).map(({ listingId, ...t }) => [String(listingId), t]));
  } catch {
    return {};
  }
}

/** Counts one view of a listing page (once per visitor and day on the server). Errors are ignored. */
export function trackListingView(id: string) {
  fetchJson(`/public/listings/${id}/view`, { method: "POST", timeoutMs: 5000 }).catch(() => undefined);
}

/** The owner deletes a listing. kept=true: a paid listing stays only as an anonymous payment record. */
export function removeListing(id: string | number) {
  return fetchJson<{ success: boolean; kept: boolean }>(`/listings/${id}/remove`, { method: "POST" });
}

// ---- Full edit form ----
export type ListingForm = {
  id: number;
  status: ListingStatus;
  price: number;
  description: string;
  city: string | null;
  year: number | null;
  mileage: number;
  mark: { id: string; name: string } | null;
  model: { id: string; name: string } | null;
  generationId: string | null;
  configurationId: string | null;
  modificationId: string | null;
  options: string[];
  photos: { id: number; url: string; preview: string }[];
  sdk: string | null;
  ltRegistered: boolean | null;
  vin: string | null;
};

export async function getListingForm(id: string): Promise<ListingForm> {
  const form = await fetchJson<ListingForm>(`/listings/${id}/form`);
  return {
    ...form,
    photos: (form.photos || []).map((p) => ({ ...p, url: resolveApiAsset(p.url)!, preview: resolveApiAsset(p.preview)! })),
  };
}

export type ListingEditPayload = {
  mark: string;
  model: string;
  generation?: string;
  configuration?: string;
  modification?: string;
  details: { year: number; mileage: number };
  price: number;
  description: string;
  city?: string;
  sdk?: string;
  ltRegistered: boolean;
  /** Empty string removes the VIN. */
  vin: string;
  options: string[];
};

export function saveListingEdit(id: string | number, payload: ListingEditPayload) {
  return fetchJson<{ success: boolean; status?: ListingStatus }>(`/listings/${id}/edit`, { method: "POST", body: JSON.stringify(payload) });
}

export function deleteListingPhoto(listingId: string | number, imageId: number) {
  return fetchJson<{ success: boolean }>(`/listings/${listingId}/photos/${imageId}`, { method: "DELETE" });
}

export function setListingCoverPhoto(listingId: string | number, imageId: number) {
  return fetchJson<{ success: boolean }>(`/listings/${listingId}/cover`, { method: "PUT", body: JSON.stringify({ imageId }) });
}

/** Admin: the "verified identity" badge, set after checking an ID document. */
export function setIdentityVerified(userId: number, verified: boolean) {
  return fetchJson<{ success: boolean }>(`/users/${userId}/edit`, { method: "POST", body: JSON.stringify({ identityVerified: verified }) });
}
