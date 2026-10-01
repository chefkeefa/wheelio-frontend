import type { ListingsQuery } from "@/lib/listings";

/** Search form state. Empty string means "any". */
export type CarFilters = {
  mark: string;
  model: string;
  city: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  mileageMax: string;
  powerMin: string;
  powerMax: string;
  volumeMin: string;
  volumeMax: string;
  drive: string;
  transmission: string;
  fuel: string;
  category: string;
  doors: string;
  withPhoto: boolean;
  sort: string;
};

export const DEFAULT_SORT = "newest";

export const EMPTY_FILTERS: CarFilters = {
  mark: "",
  model: "",
  city: "",
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  mileageMax: "",
  powerMin: "",
  powerMax: "",
  volumeMin: "",
  volumeMax: "",
  drive: "",
  transmission: "",
  fuel: "",
  category: "",
  doors: "",
  withPhoto: false,
  sort: DEFAULT_SORT,
};

const num = (value: string) => (value === "" ? undefined : Number(value));

/** Swaps a range typed the wrong way round (the API rejects from > to). */
function range(from: string, to: string): [number | undefined, number | undefined] {
  const a = num(from);
  const b = num(to);
  return a !== undefined && b !== undefined && a > b ? [b, a] : [a, b];
}

export function filtersToQuery(f: CarFilters): ListingsQuery {
  const [yearMin, yearMax] = range(f.yearMin, f.yearMax);
  const [priceMin, priceMax] = range(f.priceMin, f.priceMax);
  const [powerMin, powerMax] = range(f.powerMin, f.powerMax);
  const [volumeMin, volumeMax] = range(f.volumeMin, f.volumeMax);
  return {
    mark: f.mark || undefined,
    model: f.model || undefined,
    city: f.city || undefined,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    mileage: f.mileageMax || undefined,
    powerMin,
    powerMax,
    volumeMin,
    volumeMax,
    drive: f.drive || undefined,
    transmission: f.transmission || undefined,
    fuel: f.fuel || undefined,
    category: f.category || undefined,
    doors: f.doors || undefined,
    withPhoto: f.withPhoto ? "1" : undefined,
    sort: f.sort,
  };
}

/** Filters set inside the "Parameters" sheet (everything except make, model, year and price). */
export function countParameterFilters(f: CarFilters) {
  return [
    f.mileageMax,
    f.powerMin || f.powerMax,
    f.volumeMin || f.volumeMax,
    f.drive,
    f.transmission,
    f.fuel,
    f.category,
    f.doors,
    f.withPhoto,
    f.sort !== DEFAULT_SORT,
  ].filter(Boolean).length;
}

const URL_KEYS: Array<[keyof CarFilters, string]> = [
  ["mark", "mark"],
  ["model", "model"],
  ["city", "city"],
  ["yearMin", "yearMin"],
  ["yearMax", "yearMax"],
  ["priceMin", "priceMin"],
  ["priceMax", "priceMax"],
  ["mileageMax", "mileage"],
  ["powerMin", "powerMin"],
  ["powerMax", "powerMax"],
  ["volumeMin", "volumeMin"],
  ["volumeMax", "volumeMax"],
  ["drive", "drive"],
  ["transmission", "transmission"],
  ["fuel", "fuel"],
  ["category", "category"],
  ["doors", "doors"],
];

/** Address-bar form of the filters, so a search on /search can be shared or reloaded. */
export function filtersToSearchParams(f: CarFilters) {
  const params = new URLSearchParams();
  for (const [key, param] of URL_KEYS) {
    const value = f[key];
    if (typeof value === "string" && value) params.set(param, value);
  }
  if (f.withPhoto) params.set("withPhoto", "1");
  if (f.sort !== DEFAULT_SORT) params.set("sort", f.sort);
  return params;
}

export function filtersFromSearchParams(params: Pick<URLSearchParams, "get">): CarFilters {
  const f: CarFilters = { ...EMPTY_FILTERS };
  for (const [key, param] of URL_KEYS) {
    const value = params.get(param)?.trim().slice(0, 120);
    if (value) (f as Record<keyof CarFilters, unknown>)[key] = value;
  }
  // Older links used an exact registration year.
  const reg = params.get("reg");
  if (reg && !f.yearMin && !f.yearMax) f.yearMin = f.yearMax = reg;
  f.withPhoto = params.get("withPhoto") === "1";
  f.sort = params.get("sort") || DEFAULT_SORT;
  return f;
}
