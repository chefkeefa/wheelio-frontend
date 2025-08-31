// src/lib/sellDraft.ts

export type ContactMethod = "chat" | "phone" | "whatsapp" | "telegram";

export interface ListingDraft {
  // Шаг 1 — идентификация
  plateOrVin: string;
  mark: string;
  model: string;
  year: string;
  engine: string;

  // Шаг 2 — фото (в хранилище сохраняем только имена/URL)
  photoNames: string[];

  // Шаг 3 — состояние и комплектация
  mileage: string;
  owners: string;
  hasServiceBook: boolean;
  nextServiceDate: string; // ISO yyyy-mm-dd
  condition: "clean" | "minor" | "damaged" | "needs_repair";
  features: string[];
  description: string;

  // Шаг 4 — цена
  price: string;
  strategy: "fixed" | "negotiable" | "quick";
  allowBargain: boolean;

  // Шаг 5 — контакты/слоты
  city: string;
  area: string;
  contactMethods: ContactMethod[];
  phone: string;
  viewingWeekdays: string; // free text
  viewingWeekend: string;  // free text
}

const KEY = "sell-draft-v1";

/** Базовый пустой черновик — используем для санитации при загрузке */
const EMPTY_DRAFT: ListingDraft = {
  plateOrVin: "",
  mark: "",
  model: "",
  year: "",
  engine: "",
  photoNames: [],
  mileage: "",
  owners: "",
  hasServiceBook: false,
  nextServiceDate: "",
  condition: "clean",
  features: [],
  description: "",
  price: "",
  strategy: "fixed",
  allowBargain: false,
  city: "",
  area: "",
  contactMethods: ["chat"],
  phone: "",
  viewingWeekdays: "",
  viewingWeekend: "",
};

/** Аккуратно обрезаем все строковые поля до maxLen, не ломая тип */
function trimStringFields(draft: ListingDraft, maxLen = 4000): ListingDraft {
  const out: ListingDraft = { ...draft };
  (Object.keys(out) as (keyof ListingDraft)[]).forEach((k) => {
    const val = out[k];
    if (typeof val === "string") {
      // @ts-expect-error — присваиваем обратно ту же строку (тип совместим)
      out[k] = (val as string).slice(0, maxLen);
    }
  });
  return out;
}

/** Приводим сырые данные из localStorage к строгому ListingDraft */
function sanitizeDraft(input: unknown): ListingDraft {
  const i = (input ?? {}) as Partial<Record<keyof ListingDraft, unknown>>;
  const out: ListingDraft = {
    ...EMPTY_DRAFT,
    plateOrVin: String(i.plateOrVin ?? EMPTY_DRAFT.plateOrVin),
    mark: String(i.mark ?? EMPTY_DRAFT.mark),
    model: String(i.model ?? EMPTY_DRAFT.model),
    year: String(i.year ?? EMPTY_DRAFT.year),
    engine: String(i.engine ?? EMPTY_DRAFT.engine),

    photoNames: Array.isArray(i.photoNames) ? i.photoNames.map(String) : [],

    mileage: String(i.mileage ?? EMPTY_DRAFT.mileage),
    owners: String(i.owners ?? EMPTY_DRAFT.owners),
    hasServiceBook: Boolean(i.hasServiceBook ?? EMPTY_DRAFT.hasServiceBook),
    nextServiceDate: String(i.nextServiceDate ?? EMPTY_DRAFT.nextServiceDate),
    condition: ((): ListingDraft["condition"] => {
      const v = String(i.condition ?? EMPTY_DRAFT.condition);
      return ["clean", "minor", "damaged", "needs_repair"].includes(v)
        ? (v as ListingDraft["condition"])
        : "clean";
    })(),
    features: Array.isArray(i.features) ? i.features.map(String) : [],
    description: String(i.description ?? EMPTY_DRAFT.description),

    price: String(i.price ?? EMPTY_DRAFT.price),
    strategy: ((): ListingDraft["strategy"] => {
      const v = String(i.strategy ?? EMPTY_DRAFT.strategy);
      return ["fixed", "negotiable", "quick"].includes(v)
        ? (v as ListingDraft["strategy"])
        : "fixed";
    })(),
    allowBargain: Boolean(i.allowBargain ?? EMPTY_DRAFT.allowBargain),

    city: String(i.city ?? EMPTY_DRAFT.city),
    area: String(i.area ?? EMPTY_DRAFT.area),
    contactMethods: ((): ContactMethod[] => {
      const arr = Array.isArray(i.contactMethods) ? i.contactMethods : [];
      const allowed = new Set<ContactMethod>(["chat", "phone", "whatsapp", "telegram"]);
      const filtered = (arr as unknown[]).map(String).filter((x): x is ContactMethod => allowed.has(x as ContactMethod));
      return filtered.length ? filtered : ["chat"];
    })(),
    phone: String(i.phone ?? EMPTY_DRAFT.phone),
    viewingWeekdays: String(i.viewingWeekdays ?? EMPTY_DRAFT.viewingWeekdays),
    viewingWeekend: String(i.viewingWeekend ?? EMPTY_DRAFT.viewingWeekend),
  };

  return trimStringFields(out);
}

export function loadDraft(): ListingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveDraft(draft: ListingDraft) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = trimStringFields(draft, 4000);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
