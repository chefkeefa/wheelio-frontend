/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeSdk } from "@/lib/sdk";
import { BACKEND_ORIGIN } from "@/lib/config";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { useLatest } from "@/lib/useLatest";
import {
  createPendingListing,
  getCatalogOptions,
  getPaymentConfig,
  startCheckout,
  completeDevPayment,
  emailBlocksPublishing,
  isEmailNotVerifiedError,
  validatePromoCode,
  uploadListingImage,
  classifyListingPhoto,
  getPriceEstimate,
  lookupVin,
  me,
  type PhotoViewType,
  type PaymentConfig,
  type PriceEstimate,
  type VinDecoded,
  type VinLookup,
} from "@/lib/pirkApi";
import { CAR_OPTION_GROUPS, featureKeys } from "@/lib/carOptions";
import {
  ListingDraft,
  loadDraft,
  saveDraft,
  clearDraft,
  ContactMethod,
} from "@/lib/sellDraft";
import { LT_CITIES } from "@/lib/cities";
import AssetIcon from "@/components/ui/AssetIcon";
import Combobox, { type ComboboxOption } from "@/components/ui/Combobox";
import { useRouter } from "next/navigation";
import {
  deleteListingPhoto,
  getListingForm,
  saveListingEdit,
  setListingCoverPhoto,
  type ListingForm,
} from "@/lib/profiles";
import type { ListingStatus } from "@/lib/listings";

// --------- ВСПОМОГАТЕЛЬНОЕ ---------


const CAR_API = `${BACKEND_ORIGIN}/cars`;

type CarMark = {
  id: string;
  name: string;
  cyrillicName?: string | null;
};

type CarModel = {
  id: string;
  name: string;
  cyrillicName?: string | null;
  modelClass?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  "year-from"?: number | null;
  "year-to"?: number | null;
};

type GenerationInfo = {
  id: string;
  name: string;
  yearStart?: number | null;
  yearStop?: number | null;
  "year-start"?: number | null;
  "year-stop"?: number | null;
  restyle?: boolean;
  configurations?: number | null;
};

type Specifications = {
  horsePower?: string | null;
  kvtPower?: string | null;
  engineType?: string | null;
  transmission?: string | null;
  drive?: string | null;
  volume?: string | null;
  volumeLitres?: string | null;
  cylindersValue?: string | null;
  petrolType?: string | null;
};

type ModificationInfo = {
  id: string;
  name: string;
  specifications?: Specifications | null;
};

type ConfigurationInfo = {
  id: string;
  name: string;
  bodyType?: string | null;
  doors?: number | null;
  modifications?: ModificationInfo[] | null;
};


type VinStatus = {
  type: "success" | "warning" | "error";
  text: string;
} | null;

type PhotoMeta = {
  label: PhotoViewType;
  confidence: number;
  source: string;
  loading: boolean;
  error?: string;
};

function photoKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

type EngineOption = {
  value: string;
  label: string;
  generationId: string;
  generationName: string;
  configurationId: string;
  modificationId: string;
};

type ScoredModification = {
  option: EngineOption;
  score: number;
  evidence: number;
  conflicts: number;
};

function normalizeCatalogValue(value: string | undefined | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

function toNumber(value: string | number | undefined | null) {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function localVolumeLitres(spec?: Specifications | null) {
  const litres = toNumber(spec?.volumeLitres);
  if (litres && litres > 0) return litres;
  const raw = toNumber(spec?.volume);
  if (!raw || raw <= 0) return null;
  return raw > 20 ? raw / 1000 : raw;
}

function localPowerKw(spec?: Specifications | null) {
  const kw = toNumber(spec?.kvtPower);
  if (kw && kw > 0) return kw;
  const hp = toNumber(spec?.horsePower);
  return hp && hp > 0 ? hp * 0.735499 : null;
}

function vinPowerKw(decoded: VinDecoded) {
  const kw = toNumber(decoded.EngineKW);
  if (kw && kw > 0) return kw;
  const hp = toNumber(decoded.EngineHP);
  return hp && hp > 0 ? hp * 0.7457 : null;
}

function normalizeFuel(value: string | undefined | null) {
  const v = (value || "").toLowerCase();
  if (!v) return "";
  if (v.includes("diesel") || v.includes("диз") || v.includes("dyzel")) return "diesel";
  if (v.includes("electric") || v.includes("элект") || v.includes("elektr")) return "electric";
  if (v.includes("hybrid") || v.includes("гибрид") || v.includes("hibrid")) return "hybrid";
  if (
    v.includes("gasoline") ||
    v.includes("petrol") ||
    v.includes("бенз") ||
    v.includes("benz") ||
    /ai[-\s]?(92|95|98|100)/i.test(v)
  ) return "gasoline";
  return normalizeCatalogValue(v);
}

function normalizeTransmission(value: string | undefined | null) {
  const v = (value || "").toLowerCase();
  if (!v) return "";
  if (v.includes("automatic") || v.includes("auto") || v.includes("автомат")) return "automatic";
  if (v.includes("manual") || v.includes("механ") || v.includes("mechan")) return "manual";
  return normalizeCatalogValue(v);
}

function normalizeDrive(value: string | undefined | null) {
  const v = (value || "").toLowerCase();
  if (!v) return "";
  if (v.includes("all-wheel") || v.includes("all wheel") || v.includes("awd") || v.includes("4wd") || v.includes("полный")) return "awd";
  if (v.includes("front-wheel") || v.includes("front wheel") || v.includes("fwd") || v.includes("передн")) return "fwd";
  if (v.includes("rear-wheel") || v.includes("rear wheel") || v.includes("rwd") || v.includes("задн")) return "rwd";
  return normalizeCatalogValue(v);
}

function modelSupportsYear(model: CarModel, year: number) {
  const yearFrom = toNumber(model.yearFrom ?? model["year-from"]);
  const yearTo = toNumber(model.yearTo ?? model["year-to"]);
  if (yearFrom && year < yearFrom) return false;
  if (yearTo && year > yearTo) return false;
  return true;
}

function generationSupportsYear(generation: GenerationInfo, year: number) {
  const yearStart = toNumber(generation.yearStart ?? generation["year-start"]);
  const yearStop = toNumber(generation.yearStop ?? generation["year-stop"]);
  if (yearStart && year < yearStart) return false;
  if (yearStop && year > yearStop) return false;
  return true;
}


function vinYearCandidates(vin: string) {
  // Position 10 repeats every 30 years. We do not trust it alone;
  // later we intersect these candidates with the local model production years.
  const codes = "ABCDEFGHJKLMNPRSTVWXY123456789";
  const code = vin.toUpperCase()[9];
  const index = codes.indexOf(code);
  if (index < 0) return [] as number[];

  const baseYear = 1980 + index;
  const years: number[] = [];
  for (let year = baseYear; year <= 2099; year += 30) years.push(year);
  return years;
}

/** Lithuanian car plates: three letters and three digits (ABC123, ABC 123); also shorter custom and older plates. */
const LT_PLATE_RE = /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3,4}|\d{3}[A-Z]{2,3}|[A-Z]{1,3}\d{1,5})$/;

type VinInputProblem = { kind: "plate"; value: string } | { kind: "letters" } | { kind: "length"; length: number };

/** Why the text cannot be decoded as a VIN, or null when it is a valid VIN. */
function vinInputProblem(value: string): VinInputProblem | null {
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) return null;
  if (value.length <= 8 && LT_PLATE_RE.test(value)) return { kind: "plate", value };
  if (value.length === 17 && /^[A-Z0-9]+$/.test(value)) return { kind: "letters" };
  return { kind: "length", length: value.length };
}

/** Catalog model for a decoded name: an exact match, else the single model whose name starts the decoded one. */
function matchCatalogModel(models: CarModel[], decoded: string): CarModel | null {
  const key = normalizeCatalogValue(decoded);
  if (!key) return null;
  const exact = models.find((item) => normalizeCatalogValue(item.name) === key);
  if (exact) return exact;
  const prefixed = models.filter((item) => {
    const name = normalizeCatalogValue(item.name);
    return name.length >= 2 && key.startsWith(name);
  });
  if (!prefixed.length) return null;
  // "Golf Plus" must win over "Golf" for "Golf Plus 1.6": take the longest name, unless two are equally long.
  prefixed.sort((a, b) => normalizeCatalogValue(b.name).length - normalizeCatalogValue(a.name).length);
  const best = normalizeCatalogValue(prefixed[0].name).length;
  return prefixed.filter((item) => normalizeCatalogValue(item.name).length === best).length === 1 ? prefixed[0] : null;
}

function makeEngineLabel(
  generation: GenerationInfo,
  configuration: ConfigurationInfo,
  modification: ModificationInfo,
) {
  const spec = modification.specifications;
  const pieces: string[] = [];
  const volume = localVolumeLitres(spec);
  const kw = localPowerKw(spec);
  const fuel = spec?.engineType || spec?.petrolType;

  if (modification.name?.trim()) pieces.push(modification.name.trim());
  if (volume) pieces.push(`${volume.toFixed(1)}L`);
  if (fuel?.trim()) pieces.push(fuel.trim());
  if (kw) pieces.push(`${Math.round(kw)} kW`);
  if (spec?.transmission?.trim()) pieces.push(spec.transmission.trim());
  if (spec?.drive?.trim()) pieces.push(spec.drive.trim());

  const details = Array.from(new Set(pieces)).join(" · ");
  return `${generation.name}${configuration.name ? ` / ${configuration.name}` : ""}${details ? ` — ${details}` : ""}`;
}

function flattenEngineOptions(
  generation: GenerationInfo,
  configurations: ConfigurationInfo[],
): EngineOption[] {
  const result: EngineOption[] = [];
  for (const configuration of configurations) {
    for (const modification of configuration.modifications || []) {
      const label = makeEngineLabel(generation, configuration, modification);
      result.push({
        value: label,
        label,
        generationId: generation.id,
        generationName: generation.name,
        configurationId: configuration.id,
        modificationId: modification.id,
      });
    }
  }
  return result;
}

function scoreModification(
  decoded: VinDecoded,
  generation: GenerationInfo,
  configuration: ConfigurationInfo,
  modification: ModificationInfo,
): ScoredModification {
  const spec = modification.specifications;
  let score = 0;
  let evidence = 0;
  let conflicts = 0;

  const vinVolume = toNumber(decoded.DisplacementL);
  const dbVolume = localVolumeLitres(spec);
  if (vinVolume && dbVolume) {
    const diff = Math.abs(vinVolume - dbVolume);
    if (diff <= 0.12) { score += 4; evidence += 1; }
    else if (diff <= 0.25) { score += 2; evidence += 1; }
    else conflicts += 2;
  }

  const vinKw = vinPowerKw(decoded);
  const dbKw = localPowerKw(spec);
  if (vinKw && dbKw) {
    const diff = Math.abs(vinKw - dbKw);
    if (diff <= 6) { score += 4; evidence += 1; }
    else if (diff <= 12) { score += 2; evidence += 1; }
    else if (diff > 20) conflicts += 2;
  }

  const vinCylinders = toNumber(decoded.EngineCylinders);
  const dbCylinders = toNumber(spec?.cylindersValue);
  if (vinCylinders && dbCylinders) {
    if (vinCylinders === dbCylinders) { score += 2; evidence += 1; }
    else conflicts += 1;
  }

  const vinFuel = normalizeFuel(decoded.FuelTypePrimary);
  const dbFuel = normalizeFuel(spec?.engineType || spec?.petrolType);
  if (vinFuel && dbFuel) {
    if (vinFuel === dbFuel) { score += 2; evidence += 1; }
    else conflicts += 1;
  }

  const vinTransmission = normalizeTransmission(decoded.TransmissionStyle);
  const dbTransmission = normalizeTransmission(spec?.transmission);
  if (vinTransmission && dbTransmission && vinTransmission === dbTransmission) {
    score += 1;
    evidence += 1;
  }

  const vinDrive = normalizeDrive(decoded.DriveType);
  const dbDrive = normalizeDrive(spec?.drive);
  if (vinDrive && dbDrive && vinDrive === dbDrive) {
    score += 1;
    evidence += 1;
  }

  const vinDoors = toNumber(decoded.Doors);
  if (vinDoors && configuration.doors && vinDoors === configuration.doors) {
    score += 1;
    evidence += 1;
  }

  const trimKey = normalizeCatalogValue(`${decoded.Series || ""} ${decoded.Trim || ""}`);
  const localNameKey = normalizeCatalogValue(`${configuration.name || ""} ${modification.name || ""}`);
  if (trimKey && localNameKey && (localNameKey.includes(trimKey) || trimKey.includes(localNameKey))) {
    score += 1;
  }

  return {
    option: {
      value: makeEngineLabel(generation, configuration, modification),
      label: makeEngineLabel(generation, configuration, modification),
      generationId: generation.id,
      generationName: generation.name,
      configurationId: configuration.id,
      modificationId: modification.id,
    },
    score,
    evidence,
    conflicts,
  };
}

function chooseStrictModification(scored: ScoredModification[]) {
  const sorted = [...scored].sort((a, b) => {
    if (a.conflicts !== b.conflicts) return a.conflicts - b.conflicts;
    if (a.score !== b.score) return b.score - a.score;
    return b.evidence - a.evidence;
  });
  const best = sorted[0];
  if (!best) return null;

  // Strict mode: at least two independent VIN facts must agree,
  // no hard conflict, and the winner must be clearly ahead.
  if (best.conflicts !== 0 || best.evidence < 2 || best.score < 6) return null;

  const second = sorted[1];
  if (second && second.conflicts === 0 && second.score >= best.score - 1) return null;
  return best;
}

const INITIAL: ListingDraft = {
  plateOrVin: "",
  mark: "",
  model: "",
  year: "",
  engine: "",
  photoNames: [],
  mileage: "",
  owners: "",
  sdk: "",
  notRegisteredInLt: false,
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

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

/** Most photos a listing can have; the backend enforces the same limit (MAX_LISTING_IMAGES). */
const MAX_PHOTOS = 15;

/** Viewing hours offered in the contacts step. */
const VIEWING_HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 … 23:00
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** "any", or a range "18:00–21:00" written by the hour selects; anything else (old free text) reads as not set. */
function parseHours(value: string): { any: boolean; from: number | null; to: number | null } {
  if (value === "any") return { any: true, from: null, to: null };
  const m = value.match(/^(\d{2}):00–(\d{2}):00$/);
  return m ? { any: false, from: Number(m[1]), to: Number(m[2]) } : { any: false, from: null, to: null };
}

function formatEUR(n: number) {
  try {
    return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString()} €`;
  }
}

const FIELD =
  "w-full rounded-xl border border-border bg-muted px-4 text-[15px] font-medium text-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-accent focus:bg-card disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-bold text-accent-foreground transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-[15px] font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60";

function SellLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-foreground">{children}</label>;
}
function Hint({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={cx("mt-1.5 text-xs leading-5 text-muted-foreground", className)}>{children}</p>;
}
function SellInput({ suffix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  const input = <input {...props} className={cx(FIELD, "h-12", suffix && "pr-14", props.className)} />;
  if (!suffix) return input;
  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{suffix}</span>
    </div>
  );
}
function SellTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(FIELD, "min-h-[150px] resize-y py-3 leading-6", props.className)} />;
}
function SellSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cx(FIELD, "h-12 cursor-pointer appearance-none truncate pr-11", props.className)} />
      <AssetIcon name="chevron-down" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** Large selectable option (condition, price strategy). */
function ChoiceCard({ selected, title, note, onClick }: { selected: boolean; title: string; note?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        "flex min-h-[64px] w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
        selected ? "border-accent bg-accent/10" : "border-border hover:border-muted-foreground/40"
      )}
    >
      <span className={cx("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2", selected ? "border-accent" : "border-muted-foreground/40")}>
        {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {note && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{note}</span>}
      </span>
    </button>
  );
}

/** Multi-select chip (features, contact methods). */
function ToggleChip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition",
        on ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      <AssetIcon name={on ? "check" : "plus"} size={15} className={on ? "text-accent-ink" : ""} />
      {children}
    </button>
  );
}

function CheckRow({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium text-foreground">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-[18px] w-[18px] shrink-0 accent-accent" />
      {children}
    </label>
  );
}

function StepHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[28px]">{title}</h2>
      {lead && <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">{lead}</p>}
    </div>
  );
}

const STATUS_STYLES = {
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-200",
  error: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300",
} as const;

function StatusNote({ type, children, className = "" }: { type: keyof typeof STATUS_STYLES; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-6 ring-1", STATUS_STYLES[type], className)}>
      <AssetIcon name={type === "success" ? "check-circle" : "alert-circle"} size={18} className="mt-[3px]" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// --------- СТРАНИЦА ---------
/**
 * The six-step sell form. With `editId` it edits an existing listing instead: the same steps are filled from the
 * listing, nothing is kept as a local draft, existing photos can be removed or made the cover, and the last step
 * saves the changes instead of publishing and paying.
 */
export default function SellForm({ editId }: { editId?: string }) {
  const { language, tr } = useLanguage();
  const router = useRouter();
  const editing = Boolean(editId);
  const selfPath = editId ? `/account/listings/${editId}/edit` : "/sell";
  const loginPath = `/auth/login?return=${encodeURIComponent(selfPath)}`;
  // Selling needs an account: signed-out visitors go to the login page and come back here afterwards.
  const [signedIn, setSignedIn] = useState(false);
  const [meId, setMeId] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    me()
      .then((user) => {
        if (!alive) return;
        setSignedIn(true);
        setMeId(user?.id ?? null);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) router.replace(loginPath);
        // Network trouble: show the form; publishing checks the session again.
        else setSignedIn(true);
      });
    return () => {
      alive = false;
    };
  }, [router, loginPath]);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ListingDraft>(INITIAL);
  const [photos, setPhotos] = useState<File[]>([]); // в память, в localStorage не кладём
  const [photoMeta, setPhotoMeta] = useState<Record<string, PhotoMeta>>({});
  const [photoLimitHit, setPhotoLimitHit] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftSavedNotice, setDraftSavedNotice] = useState(false);

  // Реальный каталог автомобилей из Spring Boot
  const [marks, setMarks] = useState<CarMark[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Поколение / конфигурации из локального каталога.
  // Они нужны, чтобы VIN не "угадывал" двигатель по похожему названию.
  const [matchedGeneration, setMatchedGeneration] = useState<GenerationInfo | null>(null);
  const [generationCandidates, setGenerationCandidates] = useState<GenerationInfo[]>([]);
  const [engineOptions, setEngineOptions] = useState<EngineOption[]>([]);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  // Factory equipment of the chosen modification, offered as a starting list.
  const [factoryOptions, setFactoryOptions] = useState<{ modificationId: string; keys: string[]; source: "exact" | "similar" | null } | null>(null);
  // Equipment ticked automatically for the current version; replaced on a version change while the seller hasn't edited it.
  const autoOptions = useRef<string[] | null>(null);
  const [openOptionGroups, setOpenOptionGroups] = useState<string[]>(["comfort", "parking"]);

  // VIN autofill
  const [vinLoading, setVinLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState<VinStatus>(null);

  // Paid publication
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  // Consumer law: before a paid service starts at once, the buyer asks for it and acknowledges losing the 14-day withdrawal right.
  const [withdrawalAck, setWithdrawalAck] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<number | null>(null);
  const [publishedForReview, setPublishedForReview] = useState(false);

  // Editing an existing listing
  const [editLoadError, setEditLoadError] = useState("");
  const [editLoaded, setEditLoaded] = useState(!editId);
  const [editStatus, setEditStatus] = useState<ListingStatus | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<ListingForm["photos"]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  // The cover chosen while editing: one of the listing's photos, or a new one (by photoKey) uploaded on save.
  const [editCover, setEditCover] = useState<{ existingId?: number; newKey?: string }>({});
  // Catalog version stored with the listing, picked again once the form has loaded the engine list.
  const editTarget = useRef<{ generationId: string | null; modificationId: string | null } | null>(null);
  const [savedEdit, setSavedEdit] = useState<{ status?: string } | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // One object URL per photo, created on first use and revoked when the photo is removed.
  const photoUrls = useRef(new Map<string, string>());
  const photoUrl = (file: File) => {
    const key = photoKey(file);
    let url = photoUrls.current.get(key);
    if (!url) {
      url = URL.createObjectURL(file);
      photoUrls.current.set(key, url);
    }
    return url;
  };

  // загрузка черновика (not when editing: the listing itself is the starting point)
  useEffect(() => {
    if (editing) return;
    const d = loadDraft();
    if (d) {
      setDraft(d);
    }
  }, [editing]);

  // Editing: fill the steps from the listing.
  useEffect(() => {
    if (!editId) return;
    let alive = true;
    getListingForm(editId)
      .then((form) => {
        if (!alive) return;
        const options = form.options || [];
        editTarget.current = { generationId: form.generationId, modificationId: form.modificationId };
        setDraft({
          ...INITIAL,
          contactMethods: [...INITIAL.contactMethods],
          plateOrVin: form.vin || "",
          mark: form.mark?.name || "",
          model: form.model?.name || "",
          year: form.year ? String(form.year) : "",
          mileage: form.mileage ? String(form.mileage) : "",
          sdk: form.sdk || "",
          notRegisteredInLt: form.ltRegistered === false,
          hasServiceBook: options.includes("service-book"),
          features: options.filter((key) => key !== "service-book"),
          description: form.description || "",
          price: form.price ? String(form.price) : "",
          city: form.city || "",
        });
        setExistingPhotos(form.photos);
        setEditStatus(form.status);
        setEditLoaded(true);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 404))
          setEditLoadError(tr("This listing cannot be edited from your account.", "Šio skelbimo negalite redaguoti iš savo paskyros.", "Это объявление нельзя редактировать из вашего аккаунта."));
        else setEditLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null));
  }, []);

  // Pre-fill equipment from the catalog once a modification is chosen, unless the seller has already ticked their own.
  const chosenOptions = new Set(featureKeys(draft.features));
  const chosenModificationId = engineOptions.find((option) => option.value === draft.engine)?.modificationId || "";
  useEffect(() => {
    if (!chosenModificationId) return;
    let cancelled = false;
    getCatalogOptions(chosenModificationId)
      .then(({ keys, source }) => {
        if (cancelled) return;
        setFactoryOptions({ modificationId: chosenModificationId, keys, source });
        setDraft((d) => {
          const current = featureKeys(d.features).filter((key) => key !== "service-book");
          const previous = autoOptions.current;
          const untouched = current.length === 0 || (previous !== null && current.length === previous.length && current.every((key) => previous.includes(key)));
          if (!untouched) return d;
          autoOptions.current = keys;
          const keep = featureKeys(d.features).filter((key) => key === "service-book");
          return { ...d, features: [...keys, ...keep] };
        });
        if (keys.length) {
          const groups = CAR_OPTION_GROUPS.filter((group) => group.options.some((option) => keys.includes(option.key))).map((group) => group.id);
          setOpenOptionGroups((list) => [...new Set([...list, ...groups])]);
        }
      })
      .catch(() => {
        if (!cancelled) setFactoryOptions(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chosenModificationId]);

  // автосейв (debounce ~400ms)
  const saveRaf = useRef<number | null>(null);
  useEffect(() => {
    if (editing) return;
    if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    saveRaf.current = requestAnimationFrame(() => {
      saveDraft(draft);
      setLastSaved(new Date());
    });
    return () => {
      if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    };
  }, [draft, editing]);

  // Загружаем все марки из backend (once; the error text uses the current language via a ref)
  const trRef = useLatest(tr);
  useEffect(() => {
    let cancelled = false;

    const loadMarks = async () => {
      setCatalogLoading(true);
      try {
        const response = await fetch(`${CAR_API}?size=500`);
        if (!response.ok) throw new Error(`Car catalog returned ${response.status}`);

        const data = await response.json();
        const loaded: CarMark[] = Array.isArray(data?.content) ? data.content : [];
        // Latin names first; the catalog's "sports cars and replicas" group has only a Cyrillic name.
        const latin = (name: string) => /^[A-Za-z0-9]/.test(name);
        loaded.sort((a, b) => Number(latin(b.name)) - Number(latin(a.name)) || a.name.localeCompare(b.name));

        if (!cancelled) setMarks(loaded);
      } catch (error) {
        if (!cancelled) {
          setMarks([]);
          setVinStatus({
            type: "error",
            text: error instanceof Error ? error.message : trRef.current("Could not load car makes.", "Nepavyko įkelti automobilių markių.", "Не удалось загрузить марки автомобилей."),
          });
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };

    loadMarks();
    return () => {
      cancelled = true;
    };
  }, [trRef]);

  // Загружаем модели выбранной марки
  useEffect(() => {
    if (!draft.mark || marks.length === 0) {
      setModels([]);
      return;
    }

    const mark = marks.find((item) => item.name === draft.mark);
    if (!mark) {
      setModels([]);
      return;
    }

    let cancelled = false;

    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch(`${CAR_API}/${encodeURIComponent(mark.id)}`);
        if (!response.ok) throw new Error(`Models returned ${response.status}`);

        const data = await response.json();
        const loaded: CarModel[] = Array.isArray(data) ? data : [];
        loaded.sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) setModels(loaded);
      } catch {
        if (!cancelled) setModels([]);
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    };

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [draft.mark, marks]);


  // По выбранной марке, модели и модельному году определяем поколение.
  // Если на один год подходят два поколения, ничего автоматически не выбираем.
  useEffect(() => {
    const year = Number(draft.year);
    const mark = marks.find((item) => item.name === draft.mark);
    const model = models.find((item) => item.name === draft.model);

    setMatchedGeneration(null);
    setGenerationCandidates([]);
    setEngineOptions([]);

    if (!mark || !model || !Number.isInteger(year) || year < 1900 || year > 2100) {
      return;
    }

    if (!modelSupportsYear(model, year)) {
      return;
    }

    let cancelled = false;

    const loadConfigurationOptions = async () => {
      setConfigurationLoading(true);
      try {
        const generationsResponse = await fetch(
          `${CAR_API}/${encodeURIComponent(mark.id)}/${encodeURIComponent(model.id)}`
        );
        if (!generationsResponse.ok) return;

        const generationsData = await generationsResponse.json();
        const allGenerations: GenerationInfo[] = Array.isArray(generationsData)
          ? generationsData
          : [];
        const matching = allGenerations.filter((generation) =>
          generationSupportsYear(generation, year)
        );

        if (cancelled) return;
        setGenerationCandidates(matching);

        // Strict mode: no automatic configuration if the year belongs to
        // more than one generation (typical transition/restyle year).
        // When editing, the generation stored with the listing settles a transition year.
        const wantedGeneration = editTarget.current?.generationId;
        const preferred = wantedGeneration ? matching.find((item) => String(item.id) === String(wantedGeneration)) : undefined;
        if (matching.length !== 1 && !preferred) return;

        const generation = preferred || matching[0];
        setMatchedGeneration(generation);

        const configurationsResponse = await fetch(
          `${CAR_API}/${encodeURIComponent(mark.id)}/${encodeURIComponent(model.id)}/${encodeURIComponent(generation.id)}`
        );
        if (!configurationsResponse.ok) return;

        const configurationsData = await configurationsResponse.json();
        const configurations: ConfigurationInfo[] = Array.isArray(configurationsData)
          ? configurationsData
          : [];

        if (!cancelled) {
          const options = flattenEngineOptions(generation, configurations);
          setEngineOptions(options);
          // Editing: select the listing's own version once; later changes are the seller's.
          const wanted = editTarget.current?.modificationId;
          const hit = wanted ? options.find((option) => String(option.modificationId) === String(wanted)) : undefined;
          if (hit) {
            editTarget.current = null;
            setDraft((d) => (d.engine ? d : { ...d, engine: hit.value }));
          }
        }
      } catch {
        if (!cancelled) {
          setMatchedGeneration(null);
          setEngineOptions([]);
        }
      } finally {
        if (!cancelled) setConfigurationLoading(false);
      }
    };

    loadConfigurationOptions();
    return () => {
      cancelled = true;
    };
  }, [draft.mark, draft.model, draft.year, marks, models]);

  const autofillByVin = async () => {
    const vin = draft.plateOrVin.toUpperCase().replace(/[\s-]+/g, "");
    setVinStatus(null);

    const problem = vinInputProblem(vin);
    if (problem) {
      setVinStatus({
        type: "warning",
        text:
          problem.kind === "plate"
            ? tr(
                `${problem.value} looks like a Lithuanian number plate. Searching by plate is not available: Regitra does not offer a public lookup. Enter the 17-character VIN from the registration certificate (field E) or the plate under the windscreen, or choose the make and model below.`,
                `${problem.value} panašu į Lietuvos valstybinį numerį. Paieška pagal numerį negalima: Regitra neteikia viešos paieškos. Įveskite 17 simbolių VIN iš registracijos liudijimo (E laukas) arba lentelės po priekiniu stiklu, arba pasirinkite markę ir modelį žemiau.`,
                `${problem.value} похоже на литовский госномер. Поиск по номеру недоступен: у Regitra нет публичного поиска. Введите 17-значный VIN из техпаспорта (поле E) или с таблички под лобовым стеклом, либо выберите марку и модель ниже.`
              )
            : problem.kind === "letters"
            ? tr(
                "A VIN never contains the letters I, O or Q. Check the code: they are usually the digits 1 and 0.",
                "VIN niekada nebūna raidžių I, O ar Q. Patikrinkite kodą: dažniausiai tai skaitmenys 1 ir 0.",
                "В VIN не бывает букв I, O и Q. Проверьте код: обычно это цифры 1 и 0."
              )
            : tr(
                `A VIN has exactly 17 characters; this one has ${problem.length}.`,
                `VIN turi lygiai 17 simbolių, o šis – ${problem.length}.`,
                `В VIN ровно 17 символов, а здесь ${problem.length}.`
              ),
      });
      return;
    }

    setVinLoading(true);
    try {
      let lookup: VinLookup;
      try {
        lookup = await lookupVin(vin);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = loginPath;
          return;
        }
        setVinStatus({
          type: "error",
          text: tr(
            "The VIN check did not answer. Try again in a minute or choose the car below.",
            "VIN patikra neatsakė. Bandykite po minutės arba pasirinkite automobilį žemiau.",
            "Проверка VIN не ответила. Попробуйте через минуту или выберите автомобиль ниже."
          ),
        });
        return;
      }

      const decoded: VinDecoded = lookup.nhtsa || {};
      const decoderDown = lookup.nhtsaStatus === "unavailable";
      const decodedModel = (decoded.Model || "").trim();
      const decodedYear = Number((decoded.ModelYear || "").trim());

      // 1) MAKE: vPIC's make matched exactly to the catalog, else the manufacturer code of the VIN.
      const makeKey = normalizeCatalogValue(decoded.Make);
      const matchedMark =
        (makeKey && marks.find((item) => normalizeCatalogValue(item.name) === makeKey || normalizeCatalogValue(item.id) === makeKey)) ||
        (lookup.wmiMake ? marks.find((item) => item.id === lookup.wmiMake) : undefined);

      if (!matchedMark) {
        setDraft((current) => ({ ...current, plateOrVin: vin }));
        setVinStatus({
          type: "warning",
          text: tr(
            "The make could not be recognised from this VIN. Check the code or choose the make and model below.",
            "Pagal šį VIN markės atpažinti nepavyko. Patikrinkite kodą arba pasirinkite markę ir modelį žemiau.",
            "По этому VIN марку определить не удалось. Проверьте код или выберите марку и модель ниже."
          ),
        });
        return;
      }

      // 2) MODEL: exact match, or one catalog model whose name starts the decoded one ("Golf" for "Golf Variant").
      const modelResponse = await fetch(`${CAR_API}/${encodeURIComponent(matchedMark.id)}`);
      if (!modelResponse.ok) throw new Error(`Models returned ${modelResponse.status}`);
      const modelData = await modelResponse.json();
      const localModels: CarModel[] = Array.isArray(modelData) ? modelData : [];
      localModels.sort((a, b) => a.name.localeCompare(b.name));
      setModels(localModels);
      const matchedModel = matchCatalogModel(localModels, decodedModel);

      const notFromDecoder = decoderDown
        ? tr(
            " The public VIN decoder is not answering right now, so model and year were not read.",
            " Viešasis VIN dekoderis šiuo metu neatsako, todėl modelis ir metai nenuskaityti.",
            " Публичный декодер VIN сейчас не отвечает, поэтому модель и год не прочитаны."
          )
        : tr(
            " For many European cars the public VIN database knows only the make.",
            " Daugelio Europos automobilių viešoji VIN duomenų bazė žino tik markę.",
            " Для многих европейских автомобилей публичная база VIN знает только марку."
          );

      if (!matchedModel) {
        setDraft((current) => ({ ...current, plateOrVin: vin, mark: matchedMark.name, model: "", year: "", engine: "" }));
        setVinStatus({
          type: "warning",
          text:
            tr(`Make: ${matchedMark.name}. Choose the model and year yourself.`, `Markė: ${matchedMark.name}. Modelį ir metus pasirinkite patys.`, `Марка: ${matchedMark.name}. Модель и год выберите сами.`) +
            (decodedModel
              ? tr(` The decoder reports “${decodedModel}”, which is not in our list.`, ` Dekoderis nurodo „${decodedModel}“, kurio nėra mūsų sąraše.`, ` Декодер сообщает «${decodedModel}», такой модели нет в нашем списке.`)
              : notFromDecoder),
        });
        return;
      }

      // 3) MODEL YEAR: only when vPIC's year and VIN position 10 agree and the model was built that year.
      // Position 10 alone is not trusted: many European makers do not encode the year there.
      const verifiedYear =
        Number.isInteger(decodedYear) && modelSupportsYear(matchedModel, decodedYear) && vinYearCandidates(vin).includes(decodedYear)
          ? decodedYear
          : null;

      if (!verifiedYear) {
        setDraft((current) => ({ ...current, plateOrVin: vin, mark: matchedMark.name, model: matchedModel.name, year: "", engine: "" }));
        setVinStatus({
          type: "warning",
          text:
            tr(
              `Found ${matchedMark.name} ${matchedModel.name}. Enter the model year yourself: it cannot be read reliably from this VIN.`,
              `Rasta: ${matchedMark.name} ${matchedModel.name}. Modelio metus įveskite patys: iš šio VIN jų patikimai nuskaityti negalima.`,
              `Найдено: ${matchedMark.name} ${matchedModel.name}. Модельный год введите сами: из этого VIN его нельзя надёжно прочитать.`
            ),
        });
        return;
      }

      // 4) GENERATION: select only if exactly one local generation covers this year.
      const generationsResponse = await fetch(`${CAR_API}/${encodeURIComponent(matchedMark.id)}/${encodeURIComponent(matchedModel.id)}`);
      if (!generationsResponse.ok) throw new Error(`Generations returned ${generationsResponse.status}`);
      const generationsData = await generationsResponse.json();
      const allGenerations: GenerationInfo[] = Array.isArray(generationsData) ? generationsData : [];
      const matchingGenerations = allGenerations.filter((generation) => generationSupportsYear(generation, verifiedYear));

      setGenerationCandidates(matchingGenerations);
      setMatchedGeneration(matchingGenerations.length === 1 ? matchingGenerations[0] : null);
      setEngineOptions([]);
      setDraft((current) => ({ ...current, plateOrVin: vin, mark: matchedMark.name, model: matchedModel.name, year: String(verifiedYear), engine: "" }));

      const found = `${matchedMark.name} ${matchedModel.name}, ${verifiedYear}`;
      if (matchingGenerations.length !== 1) {
        setVinStatus({
          type: "warning",
          text: tr(`Found ${found}. Choose the engine / configuration below.`, `Rasta: ${found}. Variklį / komplektaciją pasirinkite žemiau.`, `Найдено: ${found}. Двигатель / комплектацию выберите ниже.`),
        });
        return;
      }

      const generation = matchingGenerations[0];

      // 5) CONFIGURATION/MODIFICATION: compare VIN engine facts with the local DB.
      const configurationsResponse = await fetch(
        `${CAR_API}/${encodeURIComponent(matchedMark.id)}/${encodeURIComponent(matchedModel.id)}/${encodeURIComponent(generation.id)}`
      );
      if (!configurationsResponse.ok) throw new Error(`Configurations returned ${configurationsResponse.status}`);
      const configurationsData = await configurationsResponse.json();
      const configurations: ConfigurationInfo[] = Array.isArray(configurationsData) ? configurationsData : [];
      setEngineOptions(flattenEngineOptions(generation, configurations));

      const scored: ScoredModification[] = [];
      for (const configuration of configurations) {
        for (const modification of configuration.modifications || []) {
          scored.push(scoreModification(decoded, generation, configuration, modification));
        }
      }
      const winner = chooseStrictModification(scored);

      if (winner) {
        setDraft((current) => ({ ...current, engine: winner.option.value }));
        setVinStatus({
          type: "success",
          text: tr(
            `Found ${found}, ${generation.name}. The engine was picked because several VIN facts match one version. Check it before publishing.`,
            `Rasta: ${found}, ${generation.name}. Variklis parinktas, nes keli VIN duomenys sutampa su viena versija. Patikrinkite prieš skelbdami.`,
            `Найдено: ${found}, ${generation.name}. Двигатель выбран, потому что несколько данных VIN совпали с одной версией. Проверьте перед публикацией.`
          ),
        });
      } else {
        setVinStatus({
          type: "success",
          text: tr(
            `Found ${found}, ${generation.name}. Choose the engine / configuration below.`,
            `Rasta: ${found}, ${generation.name}. Variklį / komplektaciją pasirinkite žemiau.`,
            `Найдено: ${found}, ${generation.name}. Двигатель / комплектацию выберите ниже.`
          ),
        });
      }
    } catch {
      setVinStatus({
        type: "error",
        text: tr(
          "The car catalog did not answer. Try again or choose the car below.",
          "Automobilių katalogas neatsakė. Bandykite dar kartą arba pasirinkite automobilį žemiau.",
          "Каталог автомобилей не ответил. Попробуйте ещё раз или выберите автомобиль ниже."
        ),
      });
    } finally {
      setVinLoading(false);
    }
  };

  const markOptions = useMemo(
    () => marks.map((mark) => ({ value: mark.name, label: mark.name, aliases: [mark.cyrillicName, mark.id] })),
    [marks]
  );
  const modelOptions = useMemo(
    () => models.map((model) => ({ value: model.name, label: model.name, aliases: [model.cyrillicName] })),
    [models]
  );
  const cityOptions = useMemo<ComboboxOption[]>(() => {
    const cities: string[] = [...LT_CITIES];
    if (draft.city && !cities.includes(draft.city)) cities.unshift(draft.city);
    return cities.map((city) => ({ value: city, label: city }));
  }, [draft.city]);

  // Price range of the same model on Wheelio. null = not enough similar listings, so nothing is suggested.
  const [priceHint, setPriceHint] = useState<PriceEstimate | null>(null);
  const priceMarkId = marks.find((item) => item.name === draft.mark)?.id || "";
  const priceModelId = models.find((item) => item.name === draft.model)?.id || "";
  const priceYear = Number(draft.year);
  useEffect(() => {
    setPriceHint(null);
    if (!priceMarkId || !priceModelId || !Number.isInteger(priceYear) || priceYear < 1900) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      getPriceEstimate(priceMarkId, priceModelId, priceYear)
        .then((estimate) => !cancelled && setPriceHint(estimate))
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [priceMarkId, priceModelId, priceYear]);

  // Stable component identities preserve input focus and cursor during edits.
  const L = SellLabel;
  const Input = SellInput;
  const Textarea = SellTextarea;
  const Select = SellSelect;

  const photoTypeLabel = (type: PhotoViewType) => {
    const labels: Record<PhotoViewType, [string, string, string]> = {
      FRONT: ["Front", "Priekis", "Спереди"],
      REAR: ["Rear", "Galas", "Сзади"],
      LEFT_SIDE: ["Left side", "Kairė pusė", "Левый бок"],
      RIGHT_SIDE: ["Right side", "Dešinė pusė", "Правый бок"],
      INTERIOR: ["Interior", "Salonas", "Салон"],
      DASHBOARD: ["Dashboard & mileage", "Prietaisų skydelis ir rida", "Панель приборов и пробег"],
      VIN_PLATE: ["VIN plate", "VIN lentelė", "Табличка VIN"],
      OTHER: ["Other", "Kita", "Другое"],
    };
    const value = labels[type];
    return tr(value[0], value[1], value[2]);
  };

  const classifyPhoto = async (file: File) => {
    const key = photoKey(file);
    setPhotoMeta((current) => ({
      ...current,
      [key]: { label: current[key]?.label || "OTHER", confidence: 0, source: "pending", loading: true },
    }));
    try {
      const result = await classifyListingPhoto(file);
      setPhotoMeta((current) => ({
        ...current,
        [key]: { label: result.label, confidence: result.confidence, source: result.source, loading: false },
      }));
    } catch {
      setPhotoMeta((current) => ({
        ...current,
        [key]: {
          label: current[key]?.label || "OTHER",
          confidence: current[key]?.confidence || 0,
          source: "manual",
          loading: false,
          error: tr(
            "AI recognition is unavailable. Choose the angle manually.",
            "AI atpažinimas nepasiekiamas. Pasirinkite rakursą rankiniu būdu.",
            "AI-распознавание недоступно. Выберите ракурс вручную."
          ),
        },
      }));
    }
  };

  const addPhotos = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith("image/"));
    const currentKeys = new Set(photos.map(photoKey));
    const room = MAX_PHOTOS - existingPhotos.length - photos.length;
    const accepted = imageFiles.filter((file) => !currentKeys.has(photoKey(file))).slice(0, Math.max(0, room));
    setPhotoLimitHit(imageFiles.length > accepted.length && existingPhotos.length + photos.length + accepted.length >= MAX_PHOTOS);
    if (!accepted.length) return;
    setPhotos((prev) => [...prev, ...accepted].slice(0, MAX_PHOTOS - existingPhotos.length));
    setDraft((d) => ({ ...d, photoNames: [...d.photoNames, ...accepted.map((f) => f.name)].slice(0, MAX_PHOTOS) }));
    accepted.forEach((file) => void classifyPhoto(file));
  };

  const setPhotoType = (file: File, label: PhotoViewType) => {
    const key = photoKey(file);
    setPhotoMeta((current) => ({
      ...current,
      [key]: { label, confidence: 1, source: "manual", loading: false },
    }));
  };

  /** Moves a photo to the front: the first photo is uploaded first and becomes the listing's cover. */
  const makeCover = (file: File) => {
    const key = photoKey(file);
    setPhotos((current) => [file, ...current.filter((item) => photoKey(item) !== key)]);
  };

  const clearPhotos = () => {
    photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    photoUrls.current.clear();
    setPhotos([]);
    setPhotoMeta({});
  };

  const removePhoto = (file: File) => {
    const key = photoKey(file);
    const url = photoUrls.current.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      photoUrls.current.delete(key);
    }
    setPhotos((current) => current.filter((item) => photoKey(item) !== key));
    setPhotoLimitHit(false);
    setPhotoMeta((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
    setDraft((d) => ({ ...d, photoNames: d.photoNames.filter((name) => name !== file.name) }));
  };

  // Create a PENDING_PAYMENT listing, upload photos, then start checkout.
  const EMAIL_FIRST = tr(
    "Confirm your e-mail first: we have sent a link to your address. Open it, then publish again. No e-mail? Check spam or request a new link in Profile.",
    "Pirmiausia patvirtinkite el. paštą: išsiuntėme nuorodą jūsų adresu. Atidarykite ją ir skelbkite dar kartą. Negavote? Patikrinkite šlamštą arba užsisakykite naują nuorodą profilyje.",
    "Сначала подтвердите e-mail: мы отправили ссылку на ваш адрес. Откройте её и опубликуйте снова. Письма нет? Проверьте спам или запросите новую ссылку в профиле."
  );

  /** The car, price and texts publish and save both need; null (with the error shown) when something is missing. */
  const readListingFields = () => {
    const mark = marks.find((item) => item.name === draft.mark);
    const model = models.find((item) => item.name === draft.model);
    const selectedEngine = engineOptions.find((option) => option.value === draft.engine);
    const year = Number(draft.year);
    const mileage = Number(draft.mileage || 0);
    const price = Number(draft.price);

    if (!mark || !model || !selectedEngine || !Number.isInteger(year) || year < 1900 || !Number.isFinite(price) || price <= 0) {
      setPublishError(
        tr(
          "Complete make, model, year, engine/configuration and price.",
          "Užpildykite markę, modelį, metus, variklį / komplektaciją ir kainą.",
          "Заполните марку, модель, год, двигатель / комплектацию и цену."
        )
      );
      return null;
    }

    if (!draft.description.trim()) {
      setPublishError(tr("Add a description before publishing.", "Pridėkite aprašymą prieš paskelbdami.", "Добавьте описание перед публикацией."));
      return null;
    }

    if (!draft.notRegisteredInLt && !normalizeSdk(draft.sdk)) {
      setPublishError(
        tr(
          "Enter the SDK (8 characters from Regitra): the law requires it in a car sale ad.",
          "Įveskite SDK (8 simbolių Regitros kodą): įstatymas reikalauja jį nurodyti pardavimo skelbime.",
          "Укажите SDK (8 символов из Regitra): закон требует его в объявлении о продаже."
        )
      );
      setStep(3);
      return null;
    }

    if (!draft.city.trim()) {
      setPublishError(tr("Choose the city where the car is.", "Pasirinkite miestą, kuriame yra automobilis.", "Выберите город, где находится автомобиль."));
      return null;
    }
    return { mark, model, selectedEngine, year, mileage, price };
  };

  const publish = async () => {
    setPublishError("");
    setPublishedListingId(null);

    if (paymentConfig?.paymentsEnabled !== false && !promoValid && !withdrawalAck) {
      setPublishError(
        tr(
          "Please tick the box about immediate publication before paying.",
          "Prieš mokėdami pažymėkite langelį dėl skelbimo paskelbimo iš karto.",
          "Перед оплатой отметьте галочку о немедленной публикации."
        )
      );
      return;
    }

    const fields = readListingFields();
    if (!fields) return;
    const { mark, model, selectedEngine, year, mileage, price } = fields;

    setPublishing(true);
    try {
      const normalizedPromo = paymentsOff ? "" : promoCode.trim().toUpperCase();
      if (normalizedPromo) {
        const validation = await validatePromoCode(normalizedPromo);
        if (!validation.valid) {
          setPromoValid(false);
          setPublishError(tr("This promo code is invalid or expired.", "Šis nuolaidos kodas neteisingas arba nebegalioja.", "Промокод неверный или больше не действует."));
          return;
        }
        setPromoValid(true);
      }

      // Checked before the listing is created, so no half-finished listing is left behind.
      if (await emailBlocksPublishing()) {
        setPublishError(EMAIL_FIRST);
        return;
      }

      const created = await createPendingListing({
        mark: mark.id,
        model: model.id,
        generation: selectedEngine.generationId,
        configuration: selectedEngine.configurationId,
        modification: selectedEngine.modificationId,
        price,
        description: draft.description.trim(),
        details: { year, mileage: Number.isFinite(mileage) ? mileage : 0 },
        city: draft.city.trim() || undefined,
        ...(draft.notRegisteredInLt ? { ltRegistered: false } : { sdk: normalizeSdk(draft.sdk) ?? "", ltRegistered: true }),
        ...(listingVin ? { vin: listingVin } : {}),
        options: [...featureKeys(draft.features).filter((key) => key !== "service-book"), ...(draft.hasServiceBook ? ["service-book"] : [])],
      });

      // Image failure should not charge the user silently. Stop before checkout.
      for (const photo of photos.slice(0, MAX_PHOTOS)) {
        const detected = photoMeta[photoKey(photo)]?.label || "OTHER";
        await uploadListingImage(created.id, photo, detected);
      }

      const checkout = await startCheckout(created.id, normalizedPromo || undefined);
      if (checkout.promoApplied) {
        clearDraft();
        setPublishedForReview(checkout.status === "PENDING_REVIEW");
        setPublishedListingId(checkout.listingId);
        return;
      }
      if (checkout.devMode && checkout.paymentId) {
        // Local development only (the backend refuses dev mode in production).
        await completeDevPayment(checkout.paymentId);
        window.location.href = `/payment/success?paymentId=${checkout.paymentId}`;
        return;
      }
      if (!checkout.paymentUrl) throw new Error("Payment URL was not returned");
      window.location.href = checkout.paymentUrl;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = loginPath;
        return;
      }
      if (isEmailNotVerifiedError(error)) {
        setPublishError(EMAIL_FIRST);
        return;
      }
      if (error instanceof ApiError && error.status === 403 && /phone/i.test(error.message)) {
        window.location.href = "/verify-phone?return=/sell";
        return;
      }
      setPublishError(error instanceof Error ? error.message : String(error));
    } finally {
      setPublishing(false);
    }
  };

  /** Editing: saves the fields, then removes, uploads and orders the photos. */
  const saveEdit = async () => {
    if (!editId) return;
    setPublishError("");
    setSavedEdit(null);
    const fields = readListingFields();
    if (!fields) return;
    const { mark, model, selectedEngine, year, mileage, price } = fields;
    setPublishing(true);
    try {
      const result = await saveListingEdit(editId, {
        mark: mark.id,
        model: model.id,
        generation: selectedEngine.generationId,
        configuration: selectedEngine.configurationId,
        modification: selectedEngine.modificationId,
        details: { year, mileage: Number.isFinite(mileage) ? mileage : 0 },
        price,
        description: draft.description.trim(),
        city: draft.city.trim() || undefined,
        ...(draft.notRegisteredInLt ? { ltRegistered: false } : { sdk: normalizeSdk(draft.sdk) ?? "", ltRegistered: true }),
        vin: listingVin,
        options: [...featureKeys(draft.features).filter((key) => key !== "service-book"), ...(draft.hasServiceBook ? ["service-book"] : [])],
      });
      let status: string | undefined = result.status;
      for (const id of removedPhotoIds) await deleteListingPhoto(editId, id);
      setRemovedPhotoIds([]);
      const uploaded = new Map<string, number>();
      for (const photo of photos) {
        const detected = photoMeta[photoKey(photo)]?.label || "OTHER";
        const image = await uploadListingImage(Number(editId), photo, detected);
        uploaded.set(photoKey(photo), image.id);
        if (image.listingStatus) status = image.listingStatus;
      }
      const coverId = editCover.newKey ? uploaded.get(editCover.newKey) : effectiveCover.existingId;
      if (coverId) await setListingCoverPhoto(editId, coverId);
      setSavedEdit({ status });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = loginPath;
        return;
      }
      setPublishError(error instanceof Error ? error.message : String(error));
    } finally {
      setPublishing(false);
    }
  };

  const conditionOptions: Array<{ value: ListingDraft["condition"]; title: string; note: string }> = [
    { value: "clean", title: tr("Not crashed", "Nedaužtas", "Не бит"), note: tr("No accident damage", "Be avarijos pažeidimų", "Без повреждений после ДТП") },
    { value: "minor", title: tr("Minor paint", "Smulkūs dažymo darbai", "Небольшие окрасы"), note: tr("Cosmetic repairs only", "Tik kosmetiniai taisymai", "Только косметический ремонт") },
    { value: "damaged", title: tr("Crashed", "Daužtas", "Бит"), note: tr("Was in an accident", "Patyręs avariją", "Был в ДТП") },
    { value: "needs_repair", title: tr("Needs repair", "Reikia remonto", "Требует ремонта"), note: tr("Sold as is", "Parduodamas toks, koks yra", "Продаётся как есть") },
  ];
  const strategyOptions: Array<{ value: ListingDraft["strategy"]; title: string; note: string }> = [
    { value: "fixed", title: tr("Fixed", "Fiksuota", "Фиксированная"), note: tr("The price stays as listed", "Kaina nesikeičia", "Цена не меняется") },
    { value: "negotiable", title: tr("Negotiable", "Derinama", "Договорная"), note: tr("Open to offers", "Laukiate pasiūlymų", "Готовы к предложениям") },
    { value: "quick", title: tr("Quick sale", "Greitas pardavimas", "Быстрая продажа"), note: tr("You want it gone this week", "Norite parduoti šią savaitę", "Хотите продать на этой неделе") },
  ];
  const contactLabel = (method: ContactMethod) =>
    method === "chat" ? tr("Chat", "Pokalbis", "Чат") : method === "phone" ? tr("Phone", "Telefonas", "Телефон") : method === "whatsapp" ? "WhatsApp" : "Telegram";

  const steps = [
    { title: tr("Car", "Automobilis", "Автомобиль"), done: Boolean(draft.mark && draft.model && draft.year && draft.engine) },
    { title: tr("Photos", "Nuotraukos", "Фотографии"), done: photos.length + existingPhotos.length > 0 },
    { title: tr("Condition", "Būklė", "Состояние"), done: Boolean(draft.mileage && draft.description.trim()) },
    { title: tr("Price", "Kaina", "Цена"), done: Boolean(draft.price) },
    { title: tr("Contacts", "Kontaktai", "Контакты"), done: Boolean(draft.city && draft.contactMethods.length) },
    { title: tr("Preview", "Peržiūra", "Предпросмотр"), done: false },
  ];

  // What publish() checks before payment, shown in the sidebar so nothing comes as a surprise on the last step.
  const requirements = [
    { label: tr("Make, model and year", "Markė, modelis ir metai", "Марка, модель и год"), done: Boolean(draft.mark && draft.model && draft.year), step: 1 },
    { label: tr("Engine / configuration", "Variklis / komplektacija", "Двигатель / комплектация"), done: Boolean(engineOptions.some((option) => option.value === draft.engine)), step: 1 },
    { label: tr("Description", "Aprašymas", "Описание"), done: Boolean(draft.description.trim()), step: 3 },
    { label: "SDK", done: draft.notRegisteredInLt || Boolean(normalizeSdk(draft.sdk)), step: 3 },
    { label: tr("Price", "Kaina", "Цена"), done: Boolean(Number(draft.price) > 0), step: 4 },
  ];
  const requirementsLeft = requirements.filter((item) => !item.done).length;

  const locale = language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB";
  const savedLabel = lastSaved
    ? `${tr("Draft saved", "Juodraštis išsaugotas", "Черновик сохранён")} ${lastSaved.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
    : tr("Draft not saved yet", "Juodraštis dar neišsaugotas", "Черновик ещё не сохранён");

  // Sent with the listing only when it is a valid VIN (a plate number typed here is not).
  const typedVin = draft.plateOrVin.toUpperCase().replace(/[\s-]+/g, "");
  const listingVin = vinInputProblem(typedVin) ? "" : typedVin;
  const listingTitle = [draft.mark, draft.model].filter(Boolean).join(" ") || tr("Your car", "Jūsų automobilis", "Ваш автомобиль");
  // Editing: the chosen cover, else the listing's current cover (its first photo), else the first new photo.
  const effectiveCover: { existingId?: number; newKey?: string } =
    editCover.existingId && existingPhotos.some((p) => p.id === editCover.existingId)
      ? { existingId: editCover.existingId }
      : editCover.newKey && photos.some((f) => photoKey(f) === editCover.newKey)
      ? { newKey: editCover.newKey }
      : existingPhotos[0]
      ? { existingId: existingPhotos[0].id }
      : photos[0]
      ? { newKey: photoKey(photos[0]) }
      : {};
  const newCoverFile = effectiveCover.newKey ? photos.find((f) => photoKey(f) === effectiveCover.newKey) : undefined;
  const coverUrl = editing
    ? effectiveCover.existingId
      ? existingPhotos.find((p) => p.id === effectiveCover.existingId)!.url
      : newCoverFile
      ? photoUrl(newCoverFile)
      : "/images/no-photo.svg"
    : photos[0]
    ? photoUrl(photos[0])
    : "/images/no-photo.svg";
  const totalPhotos = existingPhotos.length + photos.length;
  const removeExistingPhoto = (id: number) => {
    setExistingPhotos((list) => list.filter((p) => p.id !== id));
    setRemovedPhotoIds((list) => [...list, id]);
    setPhotoLimitHit(false);
  };
  const paymentsOff = paymentConfig?.paymentsEnabled === false;
  const publicationPrice = promoValid || paymentsOff
    ? `0.00 ${paymentConfig?.currency || "EUR"}`
    : paymentConfig
    ? `${paymentConfig.publicationPrice.toFixed(2)} ${paymentConfig.currency}`
    : "4.99 EUR";
  const engineShort = draft.engine.includes(" — ") ? draft.engine.split(" — ").slice(1).join(" — ") : draft.engine;

  const saveDraftNow = () => {
    saveDraft(draft);
    setLastSaved(new Date());
    setDraftSavedNotice(true);
  };

  const draftNotice = draftSavedNotice && (
    <StatusNote type="success" className="mt-4">
      {tr("Draft saved on this device. You can continue it any time from ", "Juodraštis išsaugotas šiame įrenginyje. Tęsti galite bet kada iš ", "Черновик сохранён на этом устройстве. Продолжить можно в любой момент из ")}
      <a href="/account/profile" className="font-semibold underline underline-offset-2">{tr("your profile", "savo profilio", "профиля")}</a>.
      {photos.length > 0 && ` ${tr("Photos are not stored in the draft, so you will need to add them again.", "Nuotraukos juodraštyje nesaugomos, jas reikės įkelti iš naujo.", "Фото в черновике не хранятся, их нужно будет добавить заново.")}`}
    </StatusNote>
  );

  const saveDraftButton = editing ? null : (
    <button type="button" onClick={saveDraftNow} className="inline-flex h-12 items-center gap-2 rounded-xl px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground">
      <AssetIcon name="bookmark" size={18} />
      {tr("Save draft", "Išsaugoti juodraštį", "Сохранить черновик")}
    </button>
  );

  const goTo = (n: number) => {
    setStep(n);
    setDraftSavedNotice(false);
    const top = panelRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** "From" and "to" hour lists; "doesn't matter" in the first list hides the second. */
  const hoursPicker = (id: string, value: string, onChange: (value: string) => void) => {
    const hours = parseHours(value);
    const from = hours.from;
    const fromOptions: ComboboxOption[] = [
      { value: "any", label: tr("Doesn't matter", "Nesvarbu", "Не важно") },
      ...VIEWING_HOURS.slice(0, -1).map((h) => ({ value: String(h), label: `${tr("from", "nuo", "с")} ${hourLabel(h)}` })),
    ];
    return (
      <div className="grid grid-cols-2 gap-2">
        <Combobox
          id={id}
          value={hours.any ? "any" : from === null ? "" : String(from)}
          placeholder={tr("Choose", "Pasirinkite", "Выберите")}
          noMatchText={tr("Nothing found", "Nieko nerasta", "Ничего не найдено")}
          options={fromOptions}
          onChange={(next) => {
            if (next === "any" || next === "") return onChange(next);
            const start = Number(next);
            const end = hours.to !== null && hours.to > start ? hours.to : Math.min(23, start + 3);
            onChange(`${hourLabel(start)}–${hourLabel(end)}`);
          }}
        />
        {from !== null && !hours.any ? (
          <Combobox
            value={String(hours.to ?? "")}
            placeholder={tr("Until", "Iki", "До")}
            noMatchText={tr("Nothing found", "Nieko nerasta", "Ничего не найдено")}
            options={VIEWING_HOURS.filter((h) => h > from).map((h) => ({ value: String(h), label: `${tr("until", "iki", "до")} ${hourLabel(h)}` }))}
            onChange={(next) => onChange(`${hourLabel(from)}–${hourLabel(Number(next))}`)}
          />
        ) : (
          <div className="flex h-12 items-center px-1 text-sm text-muted-foreground">
            {hours.any ? tr("Any time that suits the buyer", "Bet kuriuo pirkėjui patogiu laiku", "В любое удобное покупателю время") : ""}
          </div>
        )}
      </div>
    );
  };

  const stepFooter = (
    <div className="mt-10 border-t border-border pt-5">
      <div className="flex items-center gap-2 sm:gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => goTo(step - 1)} aria-label={tr("Back", "Atgal", "Назад")} className="inline-flex h-12 items-center gap-2 rounded-xl px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground">
            <AssetIcon name="arrow-left" size={18} />
            <span className="hidden sm:inline">{tr("Back", "Atgal", "Назад")}</span>
          </button>
        ) : null}
        {saveDraftButton}
        <button type="button" onClick={() => goTo(step + 1)} className="ml-auto hidden h-12 items-center px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground sm:inline-flex">
          {tr("Skip", "Praleisti", "Пропустить")}
        </button>
        <button type="button" onClick={() => goTo(step + 1)} className={cx(PRIMARY_BUTTON, "max-sm:ml-auto max-sm:px-5")}>
          {tr("Next", "Toliau", "Далее")}
          <AssetIcon name="arrow-right" size={18} />
        </button>
      </div>
      {draftNotice}
    </div>
  );

  if (editLoadError)
    return (
      <main className="container min-h-[60vh] py-16 text-center">
        <h1 className="page-title">{tr("Edit listing", "Redaguoti skelbimą", "Редактирование объявления")}</h1>
        <p className="mt-3 text-muted-foreground">{editLoadError}</p>
        <a href="/account/listings" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">
          {tr("My listings", "Mano skelbimai", "Мои объявления")}
        </a>
      </main>
    );
  if (!signedIn || !editLoaded) return <main className="min-h-[72vh]" aria-busy="true" />;

  return (
    <div>
      <section className="relative">
        <div className="relative h-[240px] overflow-hidden sm:h-[300px] md:h-[360px]">
          <img
            src="/images/hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-ink/35" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/95 via-ink/65 to-transparent sm:w-[75%] md:w-[60%]" />

          <div className="container relative pt-8 md:pt-16">
            <p className="mb-3 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 md:flex">
              <span className="h-px w-8 bg-white/70" />
              {editing ? tr("Your listing", "Jūsų skelbimas", "Ваше объявление") : tr("New listing", "Naujas skelbimas", "Новое объявление")}
            </p>
            <h1 className="max-w-[620px] text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">
              {editing ? tr("Edit listing", "Redaguoti skelbimą", "Редактирование объявления") : tr("Sell your car", "Parduok automobilį", "Продай автомобиль")}
            </h1>
            <p className="mt-3 max-w-[460px] text-sm leading-6 text-white/75 md:text-base md:leading-7">
              {editing
                ? tr(
                    "The same six steps as when you created it. Change what you need and save on the last step.",
                    "Tie patys šeši žingsniai, kaip kuriant. Pakeiskite, ką reikia, ir išsaugokite paskutiniame žingsnyje.",
                    "Те же шесть шагов, что и при создании. Измените нужное и сохраните на последнем шаге."
                  )
                : tr(
                    "Six short steps. The draft saves on this device, so you can stop and come back later.",
                    "Šeši trumpi žingsniai. Juodraštis išsaugomas šiame įrenginyje, todėl galite sustoti ir grįžti vėliau.",
                    "Шесть коротких шагов. Черновик сохраняется на этом устройстве, можно прерваться и вернуться позже."
                  )}
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div ref={panelRef} className="relative z-10 -mt-14 scroll-mt-20 overflow-hidden rounded-2xl bg-card text-foreground shadow-xl ring-1 ring-border sm:-mt-20 md:-mt-24">
          {/* Stepper: compact progress on phones, tabs on wider screens */}
          <div className="border-b border-border px-4 pt-4 sm:hidden">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[15px] font-bold text-foreground">{steps[step - 1].title}</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {tr(`Step ${step} of 6`, `${step} žingsnis iš 6`, `Шаг ${step} из 6`)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1 pb-4">
              {steps.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => goTo(i + 1)}
                  aria-label={item.title}
                  className="!min-h-0 py-1.5"
                >
                  <span className={cx("block h-1 rounded-full", i + 1 === step ? "bg-accent" : item.done ? "bg-foreground/50" : "bg-muted-foreground/25")} />
                </button>
              ))}
            </div>
          </div>
          <nav className="hidden overflow-x-auto border-b border-border px-4 sm:block md:px-8" aria-label={tr("Steps", "Žingsniai", "Шаги")}>
            <ol className="flex min-w-max gap-1 lg:gap-4">
              {steps.map((item, i) => {
                const n = i + 1;
                const active = step === n;
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => goTo(n)}
                      aria-current={active ? "step" : undefined}
                      className={cx(
                        "-mb-px inline-flex h-14 items-center gap-2.5 border-b-2 px-2 text-sm font-semibold transition",
                        active ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className={cx(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          active ? "bg-accent text-accent-foreground" : item.done ? "bg-foreground text-background" : "bg-muted text-muted-foreground ring-1 ring-border"
                        )}
                      >
                        {item.done && !active ? <AssetIcon name="check" size={14} /> : n}
                      </span>
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className={cx("grid", step < 6 && "lg:grid-cols-[minmax(0,1fr)_340px]")}>
            <div className="min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
              {/* ШАГ 1 — автомобиль */}
              {step === 1 && (
                <>
                  <StepHeading
                    title={tr("Which car are you selling?", "Kokį automobilį parduodate?", "Какой автомобиль вы продаёте?")}
                    lead={tr("Enter the VIN to fill in the make, model and year, or choose them yourself.", "Įveskite VIN, kad užpildytume markę, modelį ir metus, arba pasirinkite juos patys.", "Введите VIN, чтобы заполнить марку, модель и год, или выберите их сами.")}
                  />

                  <L htmlFor="sell-vin">VIN</L>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="sell-vin"
                      placeholder="WVGZZZ7LZ5D012345"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                      value={draft.plateOrVin}
                      onChange={(e) => {
                        setDraft({ ...draft, plateOrVin: e.target.value });
                        if (vinStatus) setVinStatus(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!vinLoading) void autofillByVin();
                        }
                      }}
                    />
                    <button type="button" onClick={autofillByVin} disabled={vinLoading} className={cx(SECONDARY_BUTTON, "shrink-0")}>
                      {vinLoading ? <AssetIcon name="spinner" size={18} className="animate-spin" /> : <AssetIcon name="search" size={18} />}
                      {vinLoading ? tr("Checking...", "Tikrinama...", "Проверка...") : tr("Autofill", "Užpildyti automatiškai", "Заполнить автоматически")}
                    </button>
                  </div>
                  <Hint>
                    {tr(
                      "17 characters, from the registration certificate (field E) or the plate under the windscreen. Search by number plate is not available.",
                      "17 simbolių, iš registracijos liudijimo (E laukas) arba lentelės po priekiniu stiklu. Paieška pagal valstybinį numerį negalima.",
                      "17 символов, из техпаспорта (поле E) или с таблички под лобовым стеклом. Поиск по госномеру недоступен."
                    )}{" "}
                    {tr(
                      "The VIN is shown in the listing so buyers can check the car.",
                      "VIN rodomas skelbime, kad pirkėjai galėtų patikrinti automobilį.",
                      "VIN будет виден в объявлении, чтобы покупатель мог проверить машину."
                    )}
                  </Hint>
                  {vinStatus && <StatusNote type={vinStatus.type} className="mt-3">{vinStatus.text}</StatusNote>}

                  <div className="mt-7 grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                    <div>
                      <L htmlFor="sell-mark">{tr("Mark", "Markė", "Марка")}</L>
                      <Combobox
                        id="sell-mark"
                        value={draft.mark}
                        disabled={catalogLoading}
                        placeholder={catalogLoading ? tr("Loading makes...", "Kraunamos markės...", "Загрузка марок...") : tr("Type or choose a make", "Įrašykite arba pasirinkite markę", "Впишите или выберите марку")}
                        noMatchText={tr("No such make in the catalog. Check the spelling.", "Tokios markės kataloge nėra. Patikrinkite rašybą.", "Такой марки нет в каталоге. Проверьте написание.")}
                        options={markOptions}
                        onChange={(value) => setDraft({ ...draft, mark: value, model: "", engine: "" })}
                      />
                    </div>

                    <div>
                      <L htmlFor="sell-model">{tr("Model", "Modelis", "Модель")}</L>
                      <Combobox
                        id="sell-model"
                        value={draft.model}
                        disabled={!draft.mark || modelsLoading}
                        placeholder={
                          !draft.mark
                            ? tr("Choose a make first", "Pirmiausia pasirinkite markę", "Сначала выберите марку")
                            : modelsLoading
                            ? tr("Loading models...", "Kraunami modeliai...", "Загрузка моделей...")
                            : tr("Type or choose a model", "Įrašykite arba pasirinkite modelį", "Впишите или выберите модель")
                        }
                        noMatchText={tr(`No such ${draft.mark} model in the catalog. Check the spelling.`, `Tokio ${draft.mark} modelio kataloge nėra. Patikrinkite rašybą.`, `Такой модели ${draft.mark} нет в каталоге. Проверьте написание.`)}
                        options={modelOptions}
                        onChange={(value) => setDraft({ ...draft, model: value, engine: "" })}
                      />
                    </div>

                    <div>
                      <L htmlFor="sell-year">{tr("Model year", "Modelio metai", "Модельный год")}</L>
                      <Input
                        id="sell-year"
                        inputMode="numeric"
                        placeholder="2017"
                        value={draft.year}
                        onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D+/g, "").slice(0, 4), engine: "" })}
                      />
                      <Hint>{tr("VIN provides the model year. The first registration year can be different.", "VIN nurodo modelio metus. Pirmos registracijos metai gali skirtis.", "VIN указывает модельный год. Год первой регистрации может отличаться.")}</Hint>
                      {matchedGeneration && (
                        <Hint className="!mt-1 font-medium text-foreground">
                          {tr("Generation:", "Karta:", "Поколение:")} {matchedGeneration.name}
                          {matchedGeneration.yearStart || matchedGeneration.yearStop
                            ? ` (${matchedGeneration.yearStart ?? "?"}–${matchedGeneration.yearStop ?? tr("present", "dabar", "н. в.")})`
                            : ""}
                        </Hint>
                      )}
                      {generationCandidates.length > 1 && (
                        <Hint className="!mt-1 text-amber-700 dark:text-amber-300">
                          {tr("This year overlaps several generations:", "Šie metai sutampa su keliomis kartomis:", "Этот год пересекается с несколькими поколениями:")} {generationCandidates.map((g) => g.name).join(", ")}.{" "}
                          {tr("Engine/configuration will not be guessed automatically.", "Variklis / komplektacija nebus parinkta automatiškai.", "Двигатель / комплектация не будут угаданы автоматически.")}
                        </Hint>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <L htmlFor="sell-engine">{tr("Engine / configuration", "Variklis / komplektacija", "Двигатель / комплектация")}</L>
                      {configurationLoading ? (
                        <Input id="sell-engine" value={tr("Loading configurations...", "Kraunamos komplektacijos...", "Загрузка комплектаций...")} disabled readOnly />
                      ) : engineOptions.length > 0 ? (
                        <Select id="sell-engine" value={draft.engine} onChange={(e) => setDraft({ ...draft, engine: e.target.value })}>
                          <option value="">{tr("Choose configuration", "Pasirinkite komplektaciją", "Выберите комплектацию")}</option>
                          {draft.engine && !engineOptions.some((option) => option.value === draft.engine) && <option value={draft.engine}>{draft.engine}</option>}
                          {engineOptions.map((option) => (
                            <option key={`${option.configurationId}:${option.modificationId}`} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id="sell-engine"
                          placeholder={tr("Choose mark, model and model year first", "Pirmiausia pasirinkite markę, modelį ir modelio metus", "Сначала выберите марку, модель и модельный год")}
                          value={draft.engine}
                          onChange={(e) => setDraft({ ...draft, engine: e.target.value })}
                        />
                      )}
                      <Hint>{tr("Autofill selects a configuration only when the VIN and the local catalog agree on at least two independent engine facts and there is one clear match.", "Komplektacija parenkama automatiškai tik tada, kai VIN ir vietinis katalogas sutampa bent pagal du nepriklausomus variklio parametrus ir yra vienas aiškus atitikmuo.", "Комплектация выбирается автоматически только если VIN и локальный каталог совпадают минимум по двум независимым параметрам двигателя и есть одно однозначное совпадение.")}</Hint>
                    </div>
                  </div>
                  {stepFooter}
                </>
              )}

              {/* ШАГ 2 — фото */}
              {step === 2 && (
                <>
                  <StepHeading
                    title={tr("Photos", "Nuotraukos", "Фотографии")}
                    lead={tr("Buyers look at photos first. Shoot in daylight and cover the angles below.", "Pirkėjai pirmiausia žiūri nuotraukas. Fotografuokite dienos šviesoje ir apimkite rakursus žemiau.", "Покупатели сначала смотрят фото. Снимайте при дневном свете и покажите ракурсы ниже.")}
                  />

                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addPhotos(Array.from(e.target.files || []));
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-input"
                    className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/60 px-6 py-8 text-center transition hover:border-accent"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      addPhotos(Array.from(e.dataTransfer.files || []));
                    }}
                  >
                    <AssetIcon name="upload" size={28} className="text-muted-foreground" />
                    <span className="mt-3 text-[15px] font-semibold text-foreground">
                      {tr("Drop photos here or choose files", "Nutempkite nuotraukas čia arba pasirinkite failus", "Перетащите фото сюда или выберите файлы")}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {tr(`Up to ${MAX_PHOTOS} photos · ${totalPhotos}/${MAX_PHOTOS} added`, `Iki ${MAX_PHOTOS} nuotraukų · pridėta ${totalPhotos}/${MAX_PHOTOS}`, `До ${MAX_PHOTOS} фото · добавлено ${totalPhotos}/${MAX_PHOTOS}`)}
                    </span>
                  </label>
                  {photoLimitHit && (
                    <StatusNote type="warning" className="mt-3">
                      {tr(
                        `A listing can have up to ${MAX_PHOTOS} photos, so the extra ones were not added. Remove a photo to add another.`,
                        `Skelbime gali būti iki ${MAX_PHOTOS} nuotraukų, todėl perteklinės nepridėtos. Ištrinkite nuotrauką, kad pridėtumėte kitą.`,
                        `В объявлении может быть до ${MAX_PHOTOS} фото, лишние не добавлены. Удалите фото, чтобы добавить другое.`
                      )}
                    </StatusNote>
                  )}

                  {existingPhotos.length > 0 && (
                    <>
                      <div className="mt-6 text-sm font-semibold text-foreground">{tr("Photos in the listing", "Skelbimo nuotraukos", "Фото в объявлении")}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {existingPhotos.map((photo) => (
                          <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                            <img src={photo.preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            {effectiveCover.existingId === photo.id ? (
                              <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                                {tr("Cover", "Viršelis", "Обложка")}
                              </span>
                            ) : (
                              <button type="button" onClick={() => setEditCover({ existingId: photo.id })} className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-black/80 max-md:!min-h-6">
                                {tr("Make cover", "Padaryti viršeliu", "Сделать обложкой")}
                              </button>
                            )}
                            <button type="button" onClick={() => removeExistingPhoto(photo.id)} aria-label={tr("Delete photo", "Ištrinti nuotrauką", "Удалить фото")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white transition hover:bg-black/80 max-md:!min-h-8">
                              <AssetIcon name="close" size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {removedPhotoIds.length > 0 && (
                        <Hint className="!mt-2">
                          {tr(
                            `${removedPhotoIds.length} photo(s) will be deleted when you save.`,
                            `Išsaugojus bus ištrinta nuotraukų: ${removedPhotoIds.length}.`,
                            `При сохранении будет удалено фото: ${removedPhotoIds.length}.`
                          )}
                        </Hint>
                      )}
                    </>
                  )}
                  {editing && photos.length > 0 && <div className="mt-6 text-sm font-semibold text-foreground">{tr("New photos", "Naujos nuotraukos", "Новые фото")}</div>}

                  {photos.length > 0 && (
                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {photos.map((f, index) => {
                        const key = photoKey(f);
                        const meta = photoMeta[key] || { label: "OTHER" as PhotoViewType, confidence: 0, source: "manual", loading: false };
                        return (
                          <div key={key} className="overflow-hidden rounded-xl ring-1 ring-border">
                            <div className="relative aspect-[4/3] bg-muted">
                              <img src={photoUrl(f)} alt={f.name} className="absolute inset-0 h-full w-full object-cover" />
                              {(editing ? effectiveCover.newKey === key : index === 0) ? (
                                <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                                  {tr("Cover", "Viršelis", "Обложка")}
                                </span>
                              ) : (
                                <button type="button" onClick={() => (editing ? setEditCover({ newKey: key }) : makeCover(f))} className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-black/80 max-md:!min-h-6">
                                  {tr("Make cover", "Padaryti viršeliu", "Сделать обложкой")}
                                </button>
                              )}
                              <button type="button" onClick={() => removePhoto(f)} aria-label={tr("Delete photo", "Ištrinti nuotrauką", "Удалить фото")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white transition hover:bg-black/80 max-md:!min-h-8">
                                <AssetIcon name="close" size={14} />
                              </button>
                            </div>
                            <div className="p-2">
                              <div className="relative">
                                <select
                                  value={meta.label}
                                  onChange={(e) => setPhotoType(f, e.target.value as PhotoViewType)}
                                  aria-label={tr("Angle", "Rakursas", "Ракурс")}
                                  className="h-9 w-full cursor-pointer appearance-none rounded-lg bg-muted px-2.5 pr-8 text-xs font-medium text-foreground outline-none max-md:!min-h-9 max-md:!text-xs"
                                >
                                  {(["FRONT", "REAR", "LEFT_SIDE", "RIGHT_SIDE", "INTERIOR", "DASHBOARD", "VIN_PLATE", "OTHER"] as PhotoViewType[]).map((type) => (
                                    <option key={type} value={type}>{photoTypeLabel(type)}</option>
                                  ))}
                                </select>
                                <AssetIcon name={meta.loading ? "spinner" : "chevron-down"} size={14} className={cx("pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground", meta.loading && "animate-spin")} />
                              </div>
                              {meta.source === "openai" && !meta.loading && (
                                <div className="mt-1 px-0.5 text-[11px] text-muted-foreground">AI · {Math.round(meta.confidence * 100)}%</div>
                              )}
                              {meta.error && <div className="mt-1 px-0.5 text-[11px] leading-4 text-amber-700 dark:text-amber-300">{meta.error}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-7">
                    <div className="text-sm font-semibold text-foreground">{tr("Angles buyers expect", "Rakursai, kurių tikisi pirkėjai", "Ракурсы, которые ждут покупатели")}</div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {(["FRONT", "REAR", "LEFT_SIDE", "RIGHT_SIDE", "INTERIOR", "DASHBOARD", "VIN_PLATE"] as PhotoViewType[]).map((type) => {
                        const done = Object.values(photoMeta).some((meta) => meta.label === type && !meta.loading);
                        return (
                          <li key={type} className={cx("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium", done ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                            {done && <AssetIcon name="check" size={14} />}
                            {photoTypeLabel(type)}
                          </li>
                        );
                      })}
                    </ul>
                    <Hint className="!mt-3">{tr("When AI photo recognition is configured, each uploaded photo is classified automatically. You can always correct the angle manually.", "Kai sukonfigūruotas AI nuotraukų atpažinimas, kiekvienas vaizdas klasifikuojamas automatiškai. Rakursą visada galima pataisyti rankiniu būdu.", "Когда настроено AI-распознавание, каждое фото классифицируется автоматически. Ракурс всегда можно исправить вручную.")}</Hint>
                  </div>
                  {stepFooter}
                </>
              )}

              {/* ШАГ 3 — состояние/комплектация */}
              {step === 3 && (
                <>
                  <StepHeading
                    title={tr("Condition & equipment", "Būklė ir įranga", "Состояние и комплектация")}
                    lead={tr("Be honest here. A clear description saves you calls from the wrong buyers.", "Būkite sąžiningi. Aiškus aprašymas sutaupys skambučių iš netinkamų pirkėjų.", "Пишите честно. Понятное описание избавит от лишних звонков.")}
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <L htmlFor="sell-mileage">{tr("Mileage", "Rida", "Пробег")}</L>
                      <Input id="sell-mileage" inputMode="numeric" suffix="km" placeholder="145000" value={draft.mileage} onChange={(e) => setDraft({ ...draft, mileage: e.target.value.replace(/\D+/g, "") })} />
                    </div>
                    <div>
                      <L htmlFor="sell-owners">{tr("Owners", "Savininkai", "Владельцы")}</L>
                      <Input id="sell-owners" inputMode="numeric" placeholder="1" value={draft.owners} onChange={(e) => setDraft({ ...draft, owners: e.target.value.replace(/\D+/g, "") })} />
                    </div>
                    <div>
                      <L htmlFor="sell-service">{tr("Next service until", "Kitas aptarnavimas iki", "Следующее ТО до")}</L>
                      <Input id="sell-service" type="date" value={draft.nextServiceDate} onChange={(e) => setDraft({ ...draft, nextServiceDate: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-border p-4">
                    <L htmlFor="sell-sdk">{tr("SDK (owner declaration code)", "SDK (savininko deklaravimo kodas)", "SDK (код декларации владельца)")}</L>
                    <Input
                      id="sell-sdk"
                      autoComplete="off"
                      maxLength={9}
                      placeholder="ABCDEFGH"
                      disabled={draft.notRegisteredInLt}
                      value={draft.notRegisteredInLt ? "" : draft.sdk}
                      onChange={(e) => setDraft({ ...draft, sdk: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
                    />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {tr(
                        "Lithuanian law requires the SDK in every sale ad of a car registered in Lithuania. You get it free in eRegitra or at a Regitra office; buyers use it to check the car.",
                        "Lietuvos įstatymai reikalauja SDK nurodyti kiekviename Lietuvoje registruoto automobilio pardavimo skelbime. Jį nemokamai gausite eRegitroje arba Regitros skyriuje; pirkėjai pagal jį tikrina automobilį.",
                        "По закону Литвы SDK обязателен в каждом объявлении о продаже машины, зарегистрированной в Литве. Его можно бесплатно получить в eRegitra или в отделении Regitra; покупатели проверяют по нему машину."
                      )}{" "}
                      <a href="https://www.eregitra.lt" target="_blank" rel="noopener noreferrer" className="underline">eregitra.lt</a>
                    </p>
                    {draft.sdk && !draft.notRegisteredInLt && !normalizeSdk(draft.sdk) && (
                      <p className="mt-1 text-xs text-red-600">{tr("The SDK has 8 letters or digits.", "SDK sudaro 8 raidės ar skaitmenys.", "SDK состоит из 8 букв или цифр.")}</p>
                    )}
                    <div className="mt-3">
                      <CheckRow id="sell-not-lt" checked={draft.notRegisteredInLt} onChange={(value) => setDraft({ ...draft, notRegisteredInLt: value })}>
                        {tr("The car is not registered in Lithuania yet (imported)", "Automobilis dar neregistruotas Lietuvoje (įvežtas)", "Машина ещё не зарегистрирована в Литве (ввезена)")}
                      </CheckRow>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CheckRow id="service-book" checked={draft.hasServiceBook} onChange={(value) => setDraft({ ...draft, hasServiceBook: value })}>
                      {tr("Has service book / docs", "Yra serviso knygelė / dokumentai", "Есть сервисная книжка / документы")}
                    </CheckRow>
                  </div>

                  <div className="mt-7">
                    <div className="mb-2 text-sm font-semibold text-foreground">{tr("Condition", "Būklė", "Состояние")}</div>
                    <div role="radiogroup" aria-label={tr("Condition", "Būklė", "Состояние")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {conditionOptions.map((option) => (
                        <ChoiceCard key={option.value} selected={draft.condition === option.value} title={option.title} note={option.note} onClick={() => setDraft({ ...draft, condition: option.value })} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground">{tr("Equipment", "Komplektacija", "Комплектация")}</div>
                      <span className="text-xs text-muted-foreground">
                        {tr(`${chosenOptions.size} selected`, `Pasirinkta: ${chosenOptions.size}`, `Выбрано: ${chosenOptions.size}`)}
                      </span>
                    </div>
                    {factoryOptions && factoryOptions.modificationId === chosenModificationId && factoryOptions.keys.length === 0 && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        {tr(
                          "The catalog has no factory equipment for this version. Tick what your car has.",
                          "Kataloge nėra šios modifikacijos gamyklinės komplektacijos. Pažymėkite, ką turi jūsų automobilis.",
                          "В каталоге нет заводской комплектации этой модификации. Отметьте, что есть в вашей машине."
                        )}
                      </p>
                    )}
                    {factoryOptions && factoryOptions.modificationId === chosenModificationId && factoryOptions.keys.length > 0 && (
                      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {factoryOptions.source === "similar"
                            ? tr(
                                "Standard equipment of similar versions of this model is ticked. Check it: untick what your car doesn't have and add the rest.",
                                "Pažymėta standartinė panašių šio modelio modifikacijų komplektacija. Patikrinkite: nuimkite tai, ko neturite, ir pridėkite trūkstamą.",
                                "Отмечена базовая комплектация похожих модификаций этой модели. Проверьте: снимите то, чего в вашей машине нет, и добавьте недостающее."
                              )
                            : tr(
                                "Factory equipment of this version is ticked. Untick what your car doesn't have and add the rest.",
                                "Pažymėta gamyklinė šios modifikacijos komplektacija. Nuimkite tai, ko jūsų automobilis neturi, ir pridėkite trūkstamą.",
                                "Отмечена заводская комплектация этой модификации. Снимите то, чего в вашей машине нет, и добавьте недостающее."
                              )}
                        </span>
                        <button
                          type="button"
                          className="font-semibold text-accent-ink hover:underline"
                          onClick={() => setDraft((d) => ({ ...d, features: [...new Set([...featureKeys(d.features), ...factoryOptions.keys])] }))}
                        >
                          {factoryOptions.source === "similar" ? tr("Tick standard equipment", "Pažymėti standartinę", "Отметить базовую") : tr("Tick factory equipment", "Pažymėti gamyklinę", "Отметить заводскую")}
                        </button>
                      </div>
                    )}
                    <div className="divide-y divide-border rounded-xl border border-border">
                      {CAR_OPTION_GROUPS.map((group) => {
                        const options = group.options.filter((option) => option.key !== "service-book");
                        const open = openOptionGroups.includes(group.id);
                        const count = options.filter((option) => chosenOptions.has(option.key)).length;
                        return (
                          <div key={group.id}>
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => setOpenOptionGroups((list) => (open ? list.filter((x) => x !== group.id) : [...list, group.id]))}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground"
                            >
                              <span>
                                {tr(group.en, group.lt, group.ru)}
                                {count > 0 && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-ink">{count}</span>}
                              </span>
                              <AssetIcon name="chevron-down" size={16} className={cx("text-muted-foreground transition", open && "rotate-180")} />
                            </button>
                            {open && (
                              <div className="flex flex-wrap gap-2 px-4 pb-4">
                                {options.map((option) => {
                                  const checked = chosenOptions.has(option.key);
                                  return (
                                    <ToggleChip
                                      key={option.key}
                                      on={checked}
                                      onClick={() =>
                                        setDraft((d) => {
                                          const keys = featureKeys(d.features);
                                          return { ...d, features: checked ? keys.filter((x) => x !== option.key) : [...keys, option.key] };
                                        })
                                      }
                                    >
                                      {tr(option.en, option.lt, option.ru)}
                                    </ToggleChip>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-baseline justify-between gap-3">
                      <L htmlFor="sell-description">{tr("Description", "Aprašymas", "Описание")}</L>
                      <span className="text-xs text-muted-foreground">{draft.description.length}</span>
                    </div>
                    <Textarea
                      id="sell-description"
                      placeholder={tr("Tell about condition, maintenance, what you like about the car...", "Aprašykite būklę, priežiūrą ir kas jums patinka šiame automobilyje...", "Расскажите о состоянии, обслуживании и о том, что вам нравится в автомобиле...")}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </div>
                  {stepFooter}
                </>
              )}

              {/* ШАГ 4 — цена */}
              {step === 4 && (
                <>
                  <StepHeading
                    title={tr("Price", "Kaina", "Цена")}
                    lead={tr("Set the price buyers will see. You can change it later in My listings.", "Nustatykite kainą, kurią matys pirkėjai. Vėliau ją galėsite pakeisti skiltyje „Mano skelbimai“.", "Укажите цену, которую увидят покупатели. Позже её можно изменить в «Моих объявлениях».")}
                  />

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <L htmlFor="sell-price">{tr("Price", "Kaina", "Цена")}</L>
                      <Input id="sell-price" inputMode="numeric" suffix="€" placeholder="12000" className="!h-14 !text-xl font-bold" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D+/g, "") })} />
                      {!!draft.price && priceHint && (
                        <Hint>
                          {Number(draft.price) < priceHint.low
                            ? tr("Below the usual price of similar cars on Wheelio: it should sell faster.", "Žemiau įprastos panašių automobilių kainos Wheelio: turėtų parduoti greičiau.", "Ниже обычной цены похожих машин на Wheelio: должна продаться быстрее.")
                            : Number(draft.price) <= priceHint.high
                            ? tr("Within the usual price of similar cars on Wheelio.", "Įprastų panašių automobilių kainų ribose Wheelio.", "В пределах обычной цены похожих машин на Wheelio.")
                            : tr("Above the usual price of similar cars on Wheelio: expect fewer calls.", "Aukščiau įprastos panašių automobilių kainos Wheelio: skambučių gali būti mažiau.", "Выше обычной цены похожих машин на Wheelio: звонков может быть меньше.")}
                        </Hint>
                      )}
                    </div>
                    {priceHint ? (
                      <div className="self-start rounded-xl border border-border px-4 py-3 md:mt-[26px]">
                        <div className="text-xs font-medium text-muted-foreground">{tr("Similar cars on Wheelio:", "Panašūs automobiliai Wheelio:", "Похожие машины на Wheelio:")}</div>
                        <div className="mt-0.5 text-lg font-bold text-foreground">{formatEUR(priceHint.low)} – {formatEUR(priceHint.high)}</div>
                        <div className="text-xs text-muted-foreground">
                          {tr(
                            `${draft.mark} ${draft.model}, ±2 years, ${priceHint.comparables} listings. Mileage and condition are not counted.`,
                            `${draft.mark} ${draft.model}, ±2 metai, skelbimų: ${priceHint.comparables}. Rida ir būklė neįskaičiuotos.`,
                            `${draft.mark} ${draft.model}, ±2 года, объявлений: ${priceHint.comparables}. Пробег и состояние не учтены.`
                          )}
                        </div>
                      </div>
                    ) : draft.mark && draft.model && draft.year ? (
                      <p className="self-start text-xs leading-5 text-muted-foreground md:mt-[34px]">
                        {tr(
                          "There are not enough similar cars on Wheelio yet to suggest a price. Compare with listings of the same model and year on other sites.",
                          "Wheelio dar per mažai panašių automobilių, kad galėtume pasiūlyti kainą. Palyginkite su to paties modelio ir metų skelbimais kitose svetainėse.",
                          "На Wheelio пока мало похожих машин, чтобы подсказать цену. Сравните с объявлениями той же модели и года на других сайтах."
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-7">
                    <div className="mb-2 text-sm font-semibold text-foreground">{tr("Strategy", "Strategija", "Стратегия")}</div>
                    <div role="radiogroup" aria-label={tr("Strategy", "Strategija", "Стратегия")} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {strategyOptions.map((option) => (
                        <ChoiceCard key={option.value} selected={draft.strategy === option.value} title={option.title} note={option.note} onClick={() => setDraft({ ...draft, strategy: option.value })} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <CheckRow id="bargain" checked={draft.allowBargain} onChange={(value) => setDraft({ ...draft, allowBargain: value })}>
                      {tr("Allow small bargain", "Leisti nedideles derybas", "Разрешить небольшой торг")}
                    </CheckRow>
                  </div>
                  {stepFooter}
                </>
              )}

              {/* ШАГ 5 — контакты/расписание */}
              {step === 5 && (
                <>
                  <StepHeading
                    title={tr("Contacts & viewing", "Kontaktai ir apžiūra", "Контакты и осмотр")}
                    lead={tr("Where the car is and when buyers can come to see it.", "Kur yra automobilis ir kada pirkėjai gali jį apžiūrėti.", "Где находится автомобиль и когда его можно посмотреть.")}
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <L htmlFor="sell-city">{tr("City", "Miestas", "Город")}</L>
                      <Combobox
                        id="sell-city"
                        value={draft.city}
                        placeholder={tr("Choose a city", "Pasirinkite miestą", "Выберите город")}
                        noMatchText={tr("Nothing found", "Nieko nerasta", "Ничего не найдено")}
                        options={cityOptions}
                        onChange={(city) => setDraft({ ...draft, city })}
                      />
                    </div>
                    <div>
                      <L htmlFor="sell-area">{tr("Area / district", "Rajonas", "Район")}</L>
                      <Input id="sell-area" placeholder="Antakalnis" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
                    </div>
                    <div>
                      <L htmlFor="sell-phone">{tr("Phone", "Telefonas", "Телефон")}</L>
                      <Input id="sell-phone" type="tel" placeholder="+370..." value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="mb-2 text-sm font-semibold text-foreground">{tr("Preferred contact methods", "Pageidaujami susisiekimo būdai", "Предпочтительные способы связи")}</div>
                    <div className="flex flex-wrap gap-2">
                      {(["chat", "phone", "whatsapp", "telegram"] as ContactMethod[]).map((m) => {
                        const on = draft.contactMethods.includes(m);
                        return (
                          <ToggleChip
                            key={m}
                            on={on}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                contactMethods: on ? d.contactMethods.filter((x) => x !== m) : [...d.contactMethods, m],
                              }))
                            }
                          >
                            {contactLabel(m)}
                          </ToggleChip>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <L htmlFor="sell-weekdays">{tr("Weekdays time", "Laikas darbo dienomis", "Время в будни")}</L>
                      {hoursPicker("sell-weekdays", draft.viewingWeekdays, (value) => setDraft((d) => ({ ...d, viewingWeekdays: value })))}
                    </div>
                    <div>
                      <L htmlFor="sell-weekend">{tr("Weekend time", "Laikas savaitgaliais", "Время в выходные")}</L>
                      {hoursPicker("sell-weekend", draft.viewingWeekend, (value) => setDraft((d) => ({ ...d, viewingWeekend: value })))}
                    </div>
                  </div>
                  {stepFooter}
                </>
              )}

              {/* ШАГ 6 — предпросмотр/публикация */}
              {step === 6 && (
                <>
                  <StepHeading
                    title={editing ? tr("Check and save", "Patikrinkite ir išsaugokite", "Проверьте и сохраните") : tr("Check and publish", "Patikrinkite ir paskelbkite", "Проверьте и опубликуйте")}
                    lead={tr("This is how buyers will see your listing.", "Taip pirkėjai matys jūsų skelbimą.", "Так покупатели увидят ваше объявление.")}
                  />

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                        <img src={coverUrl} alt={listingTitle} className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                      {editing ? (
                        totalPhotos > 1 && (
                          <div className="mt-2 grid grid-cols-5 gap-2">
                            {[
                              ...existingPhotos.filter((p) => p.id !== effectiveCover.existingId).map((p) => ({ key: `e${p.id}`, src: p.preview })),
                              ...photos.filter((f) => photoKey(f) !== effectiveCover.newKey).map((f) => ({ key: photoKey(f), src: photoUrl(f) })),
                            ]
                              .slice(0, 5)
                              .map((p) => (
                                <div key={p.key} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                                  <img src={p.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                </div>
                              ))}
                          </div>
                        )
                      ) : photos.length > 1 && (
                        <div className="mt-2 grid grid-cols-5 gap-2">
                          {photos.slice(1, 6).map((f) => (
                            <div key={photoKey(f)} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                              <img src={photoUrl(f)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      {draft.description && (
                        <div className="mt-6">
                          <div className="mb-1.5 text-sm font-semibold text-foreground">{tr("Description", "Aprašymas", "Описание")}</div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{draft.description}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold leading-7 text-foreground">
                        {listingTitle} {draft.year && <span className="font-semibold text-muted-foreground">{draft.year}</span>}
                      </h3>
                      <div className="mt-1 text-[28px] font-extrabold tracking-tight text-foreground">
                        {draft.price ? formatEUR(Number(draft.price)) : "—"}
                      </div>

                      <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                        {[
                          [tr("Engine", "Variklis", "Двигатель"), draft.engine || "—"],
                          [tr("Mileage", "Rida", "Пробег"), draft.mileage ? `${Number(draft.mileage).toLocaleString("lt-LT")} km` : "—"],
                          ["VIN", listingVin || "—"],
                          ["SDK", draft.notRegisteredInLt ? tr("Not registered in Lithuania", "Neregistruotas Lietuvoje", "Не зарегистрирован в Литве") : normalizeSdk(draft.sdk) || "—"],
                          [tr("Condition", "Būklė", "Состояние"), conditionOptions.find((option) => option.value === draft.condition)?.title || "—"],
                          [tr("Equipment", "Komplektacija", "Комплектация"), chosenOptions.size ? tr(`${chosenOptions.size} options`, `${chosenOptions.size} pasirinkimai`, `${chosenOptions.size} опций`) : "—"],
                          [tr("City/Area", "Miestas / rajonas", "Город / район"), [draft.city, draft.area].filter(Boolean).join(", ") || "—"],
                          [tr("Contacts", "Kontaktai", "Контакты"), `${draft.contactMethods.map(contactLabel).join(", ") || tr("chat only", "tik pokalbis", "только чат")}${draft.phone ? ` (${draft.phone})` : ""}`],
                        ].map(([term, value]) => (
                          <div key={term} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5">
                            <dt className="text-muted-foreground">{term}</dt>
                            <dd className="break-words font-medium text-foreground">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      {editing ? (
                        paymentConfig?.moderationEnabled && editStatus === "ACTIVE" && (
                          <StatusNote type="warning" className="mt-6">
                            {tr(
                              "Changes to the car, price, text, city, SDK, VIN or new photos are checked again: the listing is hidden until a moderator approves it.",
                              "Automobilio, kainos, teksto, miesto, SDK, VIN pakeitimai ar naujos nuotraukos tikrinami iš naujo: skelbimas paslepiamas, kol moderatorius jį patvirtins.",
                              "Изменения машины, цены, текста, города, SDK, VIN или новые фото проверяются заново: объявление скрыто, пока модератор его не одобрит."
                            )}
                          </StatusNote>
                        )
                      ) : (
                      <div className="mt-6 rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[15px] font-bold text-foreground">{tr("Listing publication", "Skelbimo publikavimas", "Размещение объявления")}</div>
                            <div className="mt-0.5 text-sm leading-6 text-muted-foreground">
                              {paymentsOff ? tr(
                                "Publishing is free for now. The listing goes public right away.",
                                "Kol kas skelbti nemokama. Skelbimas paskelbiamas iš karto.",
                                "Сейчас публикация бесплатна. Объявление появится сразу."
                              ) : tr(
                                promoValid ? "With this promo code, the listing is published for free." : "The listing becomes public only after confirmed payment.",
                                promoValid ? "Su šiuo kodu skelbimas paskelbiamas nemokamai." : "Skelbimas tampa viešas tik patvirtinus mokėjimą.",
                                promoValid ? "С этим промокодом объявление публикуется бесплатно." : "Объявление станет публичным только после подтверждённой оплаты."
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-xl font-extrabold text-foreground">{publicationPrice}</div>
                        </div>

                        {!paymentsOff && (<>
                        <label htmlFor="sell-promo" className="mt-4 block text-sm font-semibold text-foreground">{tr("Promo code", "Nuolaidos kodas", "Промокод")}</label>
                        <div className="mt-1.5 flex gap-2">
                          <input
                            id="sell-promo"
                            value={promoCode}
                            onChange={(event) => { setPromoCode(event.target.value); setPromoValid(false); setPublishError(""); }}
                            placeholder={tr("Enter promo code", "Įveskite kodą", "Введите промокод")}
                            autoComplete="off"
                            maxLength={64}
                            className={cx(FIELD, "h-12 min-w-0 flex-1 uppercase placeholder:normal-case")}
                          />
                          <button
                            type="button"
                            className={SECONDARY_BUTTON}
                            disabled={!promoCode.trim() || promoChecking || publishing}
                            onClick={async () => {
                              setPromoChecking(true); setPublishError("");
                              try {
                                const result = await validatePromoCode(promoCode.trim().toUpperCase());
                                setPromoValid(result.valid);
                                if (!result.valid) setPublishError(tr("This promo code is invalid or expired.", "Šis nuolaidos kodas neteisingas arba nebegalioja.", "Промокод неверный или больше не действует."));
                              } catch (error) {
                                setPromoValid(false);
                                setPublishError(error instanceof Error ? error.message : String(error));
                              } finally { setPromoChecking(false); }
                            }}
                          >
                            {promoChecking && <AssetIcon name="spinner" size={18} className="animate-spin" />}
                            {tr("Apply", "Taikyti", "Применить")}
                          </button>
                        </div>
                        {promoValid && <StatusNote type="success" className="mt-3">{tr("Code applied — this listing is free.", "Kodas pritaikytas — skelbimas nemokamas.", "Промокод применён — публикация бесплатна.")}</StatusNote>}
                        </>)}
                        {!paymentsOff && !promoValid && (
                          <label className="mt-4 flex gap-3 text-sm leading-6 text-foreground">
                            <input type="checkbox" checked={withdrawalAck} onChange={(e) => setWithdrawalAck(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--accent))]" />
                            <span>
                              {tr(
                                "I ask Wheelio to publish my listing right after payment and understand that I lose my 14-day right of withdrawal once the listing is published. The price is final and includes all taxes.",
                                "Prašau Wheelio paskelbti skelbimą iškart po apmokėjimo ir suprantu, kad paskelbus skelbimą netenku 14 dienų teisės atsisakyti sutarties. Kaina galutinė, su visais mokesčiais.",
                                "Прошу Wheelio опубликовать объявление сразу после оплаты и понимаю, что после публикации теряю 14-дневное право на отказ от договора. Цена итоговая, со всеми налогами."
                              )}
                            </span>
                          </label>
                        )}
                        {paymentConfig?.devMode && (
                          <div className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                            DEV MODE — {tr("test payment is enabled", "įjungtas bandomasis mokėjimas", "включена тестовая оплата")}
                          </div>
                        )}
                      </div>
                      )}

                      {requirementsLeft > 0 && (
                        <StatusNote type="warning" className="mt-4">
                          {tr("Still missing:", "Dar trūksta:", "Ещё не заполнено:")}{" "}
                          {requirements.filter((item) => !item.done).map((item, i, list) => (
                            <span key={item.label}>
                              <button type="button" onClick={() => goTo(item.step)} className="font-semibold underline underline-offset-2 max-md:!min-h-0">{item.label}</button>
                              {i < list.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </StatusNote>
                      )}
                      {publishError && <StatusNote type="error" className="mt-4">{publishError}</StatusNote>}
                      {savedEdit && (
                        <StatusNote type="success" className="mt-4">
                          <span className="font-semibold">{tr("Changes saved.", "Pakeitimai išsaugoti.", "Изменения сохранены.")}</span>{" "}
                          {savedEdit.status === "PENDING_REVIEW"
                            ? tr(
                                "The listing is back on review and will reappear once a moderator approves it.",
                                "Skelbimas vėl tikrinamas ir atsiras, kai moderatorius jį patvirtins.",
                                "Объявление снова на проверке и появится после одобрения модератором."
                              )
                            : <a className="underline" href={`/listing/${editId}`}>{tr("Open listing", "Atidaryti skelbimą", "Открыть объявление")}</a>}
                        </StatusNote>
                      )}
                      {publishedListingId && (
                        <StatusNote type="success" className="mt-4">
                          {publishedForReview ? (
                            <span className="font-semibold">{tr("Your listing was sent for review. It will appear on the site once a moderator approves it.", "Skelbimas išsiųstas patikrinti. Jis atsiras svetainėje, kai moderatorius jį patvirtins.", "Объявление отправлено на проверку. Оно появится на сайте после одобрения модератором.")}</span>
                          ) : (
                            <>
                              <span className="font-semibold">{paymentsOff ? tr("Your listing is published!", "Skelbimas paskelbtas!", "Объявление опубликовано!") : tr("Your listing is published for free!", "Skelbimas paskelbtas nemokamai!", "Объявление опубликовано бесплатно!")}</span>{" "}
                              <a className="underline" href={`/listing/${publishedListingId}`}>{tr("Open listing", "Atidaryti skelbimą", "Открыть объявление")}</a>
                            </>
                          )}
                        </StatusNote>
                      )}

                      <button
                        type="button"
                        className={cx(PRIMARY_BUTTON, "mt-5 h-14 w-full text-base")}
                        onClick={
                          editing
                            ? savedEdit
                              ? () => { window.location.href = meId ? `/user/${meId}` : "/account/listings"; }
                              : saveEdit
                            : publishedListingId ? () => { window.location.href = "/account/listings"; } : publish
                        }
                        disabled={publishing}
                        aria-busy={publishing || undefined}
                      >
                        {publishing && <AssetIcon name="spinner" size={20} className="animate-spin" />}
                        {editing ? (savedEdit ? tr("My page", "Mano puslapis", "Моя страница") : tr("Save changes", "Išsaugoti pakeitimus", "Сохранить изменения")) : publishedListingId ? tr("My listings", "Mano skelbimai", "Мои объявления") : paymentsOff ? tr("Publish", "Paskelbti", "Опубликовать") : promoValid ? tr("Publish for free", "Paskelbti nemokamai", "Опубликовать бесплатно") : tr("Pay & publish", "Mokėti ir paskelbti", "Оплатить и опубликовать")}
                      </button>
                      {!publishedListingId && !savedEdit && (
                        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                          {tr("By publishing you confirm the listing follows the ", "Skelbdami patvirtinate, kad skelbimas atitinka ", "Публикуя, вы подтверждаете, что объявление соответствует ")}
                          <a href="/rules" target="_blank" rel="noopener" className="underline">{tr("Rules", "Taisykles", "Правилам")}</a>.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                    <button type="button" onClick={() => goTo(5)} className="inline-flex h-12 items-center gap-2 rounded-xl px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground">
                      <AssetIcon name="arrow-left" size={18} />
                      {tr("Back", "Atgal", "Назад")}
                    </button>
                    <button type="button" onClick={() => goTo(1)} className="inline-flex h-12 items-center gap-2 rounded-xl px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-foreground">
                      <AssetIcon name="edit" size={18} />
                      {tr("Edit", "Redaguoti", "Редактировать")}
                    </button>
                    {saveDraftButton}
                    {!editing && <button
                      type="button"
                      onClick={() => { clearDraft(); setDraft(INITIAL); clearPhotos(); setDraftSavedNotice(false); }}
                      className="ml-auto inline-flex h-12 items-center gap-2 rounded-xl px-2 text-[15px] font-semibold text-muted-foreground transition hover:text-red-600"
                    >
                      <AssetIcon name="trash" size={18} />
                      {tr("Clear draft", "Išvalyti juodraštį", "Очистить черновик")}
                    </button>}
                  </div>
                  {draftNotice}
                </>
              )}
            </div>

            {/* Live summary of the listing (steps 1–5, desktop) */}
            {step < 6 && (
              <aside className="hidden border-l border-border bg-muted/40 p-6 lg:block">
                <div className="sticky top-24">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-foreground">{tr("Your listing", "Jūsų skelbimas", "Ваше объявление")}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AssetIcon name="clock" size={14} />
                      {editing ? null : savedLabel}
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-border">
                    <div className="relative aspect-[16/10] bg-muted">
                      <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      {totalPhotos > 1 && (
                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
                          <AssetIcon name="image" size={12} />
                          {totalPhotos}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="truncate text-[15px] font-semibold text-foreground">{listingTitle}</div>
                      <div className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
                        {draft.price ? formatEUR(Number(draft.price)) : <span className="text-muted-foreground/60">— €</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><AssetIcon name="calendar" size={15} className="text-muted-foreground/80" />{draft.year || "—"}</span>
                        <span className="inline-flex items-center gap-1.5"><AssetIcon name="gauge" size={15} className="text-muted-foreground/80" />{draft.mileage ? `${Number(draft.mileage).toLocaleString("lt-LT")} km` : "—"}</span>
                        <span className="col-span-2 inline-flex min-w-0 items-center gap-1.5"><AssetIcon name="engine" size={15} className="text-muted-foreground/80" /><span className="truncate">{engineShort || "—"}</span></span>
                        {draft.city && <span className="col-span-2 inline-flex items-center gap-1.5"><AssetIcon name="map-pin" size={15} className="text-muted-foreground/80" />{[draft.city, draft.area].filter(Boolean).join(", ")}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {requirementsLeft
                        ? tr(`Needed to publish · ${requirementsLeft} left`, `Reikia paskelbimui · liko ${requirementsLeft}`, `Нужно для публикации · осталось ${requirementsLeft}`)
                        : tr("Ready to publish", "Paruošta paskelbti", "Готово к публикации")}
                    </div>
                    <ul className="mt-3 space-y-1">
                      {requirements.map((item) => (
                        <li key={item.label}>
                          <button type="button" onClick={() => goTo(item.step)} className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left text-sm transition hover:text-foreground">
                            <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", item.done ? "bg-foreground text-background" : "ring-1 ring-inset ring-muted-foreground/40")}>
                              {item.done && <AssetIcon name="check" size={12} />}
                            </span>
                            <span className={item.done ? "text-muted-foreground line-through decoration-muted-foreground/40" : "font-medium text-foreground"}>{item.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!editing && <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="text-muted-foreground">{tr("Publication fee", "Paskelbimo kaina", "Стоимость публикации")}</span>
                    <span className="font-bold text-foreground">{publicationPrice}</span>
                  </div>}
                </div>
              </aside>
            )}
          </div>
        </div>
        {!editing && <p className="mt-3 text-center text-xs text-muted-foreground lg:hidden">{savedLabel}</p>}
      </section>
    </div>
  );
}
