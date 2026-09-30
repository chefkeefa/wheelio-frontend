/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button";
import { anybody } from "@/lib/fonts";
import { BACKEND_ORIGIN } from "@/lib/config";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { useLatest } from "@/lib/useLatest";
import {
  createPendingListing,
  getPaymentConfig,
  startCheckout,
  validatePromoCode,
  uploadListingImage,
  classifyListingPhoto,
  type PhotoViewType,
  type PaymentConfig,
} from "@/lib/pirkApi";
import {
  ListingDraft,
  loadDraft,
  saveDraft,
  clearDraft,
  ContactMethod,
} from "@/lib/sellDraft";

// --------- ВСПОМОГАТЕЛЬНОЕ ---------
const FEATURE_DEFS = [
  { value: "Climate control", en: "Climate control", lt: "Klimato kontrolė", ru: "Климат-контроль" },
  { value: "Leather seats", en: "Leather seats", lt: "Odinės sėdynės", ru: "Кожаные сиденья" },
  { value: "Heated seats", en: "Heated seats", lt: "Šildomos sėdynės", ru: "Подогрев сидений" },
  { value: "Parking sensors", en: "Parking sensors", lt: "Parkavimo jutikliai", ru: "Парктроники" },
  { value: "LED lights", en: "LED lights", lt: "LED žibintai", ru: "LED-фары" },
  { value: "Navigation", en: "Navigation", lt: "Navigacija", ru: "Навигация" },
  { value: "Winter tires", en: "Winter tires", lt: "Žieminės padangos", ru: "Зимние шины" },
  { value: "Apple CarPlay / Android Auto", en: "Apple CarPlay / Android Auto", lt: "Apple CarPlay / Android Auto", ru: "Apple CarPlay / Android Auto" },
] as const;


const CAR_API = `${BACKEND_ORIGIN}/cars`;
const NHTSA_VIN_API = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

type CarMark = {
  id: string;
  name: string;
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

type VinDecodeResult = {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Series?: string;
  Trim?: string;
  BodyClass?: string;
  Doors?: string;
  DriveType?: string;
  TransmissionStyle?: string;
  TransmissionSpeeds?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  EngineKW?: string;
  EngineModel?: string;
  FuelTypePrimary?: string;
  ErrorCode?: string;
  ErrorText?: string;
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

function vinPowerKw(decoded: VinDecodeResult) {
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
  decoded: VinDecodeResult,
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl bg-card text-foreground ring-1 ring-border p-4 md:p-6", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={`${anybody.className} mb-4 text-2xl font-bold`}>{children}</h2>
  );
}

// подсказка цены (MVP-фикция)
function usePriceHint(draft: ListingDraft) {
  return useMemo(() => {
    if (!draft.mark || !draft.model || !draft.year) return null;
    const base = 10000;
    const year = parseInt(draft.year || "0", 10);
    const age = year ? Math.max(0, 2025 - year) : 5;
    const adj = Math.max(2000, 15000 - age * 700);
    const low = Math.max(2000, base + adj - 1500);
    const high = base + adj + 800;
    return { low, high };
  }, [draft.mark, draft.model, draft.year]);
}

function formatEUR(n: number) {
  try {
    return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString()} €`;
  }
}

function SellLabel({ children }: { children: React.ReactNode }) {
  return <label className={`${anybody.className} mb-1 block text-[15px] font-bold text-muted-foreground md:text-base`}>{children}</label>;
}
function SellInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(anybody.className, "w-full rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-2.5 text-[15px] font-bold text-black outline-none focus:border-[hsl(var(--accent))]", props.className)} />;
}
function SellTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(anybody.className, "min-h-[120px] w-full resize-vertical rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-3 text-[15px] font-bold text-black outline-none focus:border-[hsl(var(--accent))]", props.className)} />;
}
function SellSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(anybody.className, "w-full appearance-none rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-2.5 text-[15px] font-bold text-black outline-none focus:border-[hsl(var(--accent))]", props.className)} />;
}

// --------- СТРАНИЦА ---------
export default function SellPage() {
  const { language, tr } = useLanguage();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ListingDraft>(INITIAL);
  const [photos, setPhotos] = useState<File[]>([]); // в память, в localStorage не кладём
  const [photoMeta, setPhotoMeta] = useState<Record<string, PhotoMeta>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  // VIN autofill
  const [vinLoading, setVinLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState<VinStatus>(null);

  // Paid publication
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<number | null>(null);

  // загрузка черновика
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setDraft(d);
    }
  }, []);

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null));
  }, []);

  // автосейв (debounce ~400ms)
  const saveRaf = useRef<number | null>(null);
  useEffect(() => {
    if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    saveRaf.current = requestAnimationFrame(() => {
      saveDraft(draft);
      setLastSaved(new Date());
    });
    return () => {
      if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    };
  }, [draft]);

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
        loaded.sort((a, b) => a.name.localeCompare(b.name));

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
        if (matching.length !== 1) return;

        const generation = matching[0];
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
          setEngineOptions(flattenEngineOptions(generation, configurations));
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
    const vin = draft.plateOrVin.trim().toUpperCase();
    setVinStatus(null);

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setVinStatus({
        type: "error",
        text: tr("Autofill works only with a valid 17-character VIN. Lithuanian plate lookup is not connected yet.", "Automatinis užpildymas veikia tik su galiojančiu 17 simbolių VIN. Lietuvos numerių paieška dar neprijungta.", "Автозаполнение работает только с корректным 17-значным VIN. Поиск по литовскому госномеру пока не подключён."),
      });
      return;
    }

    setVinLoading(true);

    try {
      const response = await fetch(
        `${NHTSA_VIN_API}/${encodeURIComponent(vin)}?format=json`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`VIN service returned ${response.status}`);
      }

      const data = await response.json();
      const decoded: VinDecodeResult | undefined = data?.Results?.[0];
      if (!decoded) throw new Error(tr("VIN service returned no vehicle data.", "VIN paslauga negrąžino automobilio duomenų.", "VIN-сервис не вернул данные автомобиля."));

      const decodedMake = (decoded.Make || "").trim();
      const decodedModel = (decoded.Model || "").trim();
      const decodedYear = Number((decoded.ModelYear || "").trim());

      if (!decodedMake || !decodedModel || !Number.isInteger(decodedYear)) {
        throw new Error(
          decoded.ErrorText ||
            tr(
              "VIN did not return a complete make, model and model year. Please choose the missing values manually.",
              "VIN negrąžino visų markės, modelio ir modelio metų duomenų. Trūkstamas reikšmes pasirinkite rankiniu būdu.",
              "VIN не вернул полные данные о марке, модели и модельном годе. Выберите недостающие значения вручную."
            )
        );
      }

      // 1) MAKE: exact normalized match only. No fuzzy guessing.
      const makeKey = normalizeCatalogValue(decodedMake);
      const matchedMark = marks.find(
        (item) =>
          normalizeCatalogValue(item.name) === makeKey ||
          normalizeCatalogValue(item.id) === makeKey
      );

      if (!matchedMark) {
        setDraft((current) => ({
          ...current,
          plateOrVin: vin,
          year: "",
          engine: "",
        }));
        setVinStatus({
          type: "warning",
          text: `VIN decoded as ${decodedMake} ${decodedModel}, model year ${decodedYear}, but this make was not matched exactly in the PirkAuto catalog. Nothing else was guessed.`,
        });
        return;
      }

      // 2) MODEL: fetch local models and require exact normalized match.
      const modelResponse = await fetch(`${CAR_API}/${encodeURIComponent(matchedMark.id)}`);
      if (!modelResponse.ok) throw new Error(`Models returned ${modelResponse.status}`);

      const modelData = await modelResponse.json();
      const localModels: CarModel[] = Array.isArray(modelData) ? modelData : [];
      localModels.sort((a, b) => a.name.localeCompare(b.name));
      setModels(localModels);

      const modelKey = normalizeCatalogValue(decodedModel);
      const matchedModel = localModels.find(
        (item) => normalizeCatalogValue(item.name) === modelKey
      );

      if (!matchedModel) {
        setDraft((current) => ({
          ...current,
          plateOrVin: vin,
          mark: matchedMark.name,
          model: "",
          year: "",
          engine: "",
        }));
        setVinStatus({
          type: "warning",
          text: `Make matched (${matchedMark.name}), but VIN model “${decodedModel}” has no exact match in the local catalog. Model/configuration were left for manual selection.`,
        });
        return;
      }

      // 3) MODEL YEAR: cross-check two independent sources:
      // NHTSA's decoded ModelYear and VIN position 10. Position 10 repeats every
      // 30 years, so we disambiguate it using the local model production range.
      const localVinYearCandidates = vinYearCandidates(vin).filter((year) =>
        modelSupportsYear(matchedModel, year)
      );

      let verifiedYear: number | null = null;
      if (
        modelSupportsYear(matchedModel, decodedYear) &&
        localVinYearCandidates.includes(decodedYear)
      ) {
        verifiedYear = decodedYear;
      } else if (localVinYearCandidates.length === 1) {
        verifiedYear = localVinYearCandidates[0];
      }

      if (!verifiedYear) {
        setDraft((current) => ({
          ...current,
          plateOrVin: vin,
          mark: matchedMark.name,
          model: matchedModel.name,
          year: "",
          engine: "",
        }));
        setVinStatus({
          type: "warning",
          text: `VIN year is ambiguous. Decoder reports ${decodedYear}, while VIN position 10/local production years do not confirm one unique year for ${matchedModel.name}. Year and configuration were left for manual selection.`,
        });
        return;
      }

      // 4) GENERATION: select only if exactly one local generation covers this year.
      const generationsResponse = await fetch(
        `${CAR_API}/${encodeURIComponent(matchedMark.id)}/${encodeURIComponent(matchedModel.id)}`
      );
      if (!generationsResponse.ok) throw new Error(`Generations returned ${generationsResponse.status}`);

      const generationsData = await generationsResponse.json();
      const allGenerations: GenerationInfo[] = Array.isArray(generationsData)
        ? generationsData
        : [];
      const matchingGenerations = allGenerations.filter((generation) =>
        generationSupportsYear(generation, verifiedYear)
      );

      setGenerationCandidates(matchingGenerations);
      setMatchedGeneration(matchingGenerations.length === 1 ? matchingGenerations[0] : null);
      setEngineOptions([]);

      // Fill only the fields that are already verified.
      setDraft((current) => ({
        ...current,
        plateOrVin: vin,
        mark: matchedMark.name,
        model: matchedModel.name,
        year: String(verifiedYear),
        engine: "",
      }));

      if (matchingGenerations.length !== 1) {
        const names = matchingGenerations.map((g) => g.name).filter(Boolean).join(", ");
        setVinStatus({
          type: "warning",
          text:
            matchingGenerations.length === 0
              ? `VIN matched ${matchedMark.name} ${matchedModel.name}, model year ${verifiedYear}, but no local generation covers that year. Configuration was not guessed.`
              : `VIN matched ${matchedMark.name} ${matchedModel.name}, model year ${verifiedYear}, but several generations overlap that year (${names}). Configuration was not guessed.`,
        });
        return;
      }

      const generation = matchingGenerations[0];

      // 5) CONFIGURATION/MODIFICATION: compare VIN engine facts with the local DB.
      const configurationsResponse = await fetch(
        `${CAR_API}/${encodeURIComponent(matchedMark.id)}/${encodeURIComponent(matchedModel.id)}/${encodeURIComponent(generation.id)}`
      );
      if (!configurationsResponse.ok) {
        throw new Error(`Configurations returned ${configurationsResponse.status}`);
      }

      const configurationsData = await configurationsResponse.json();
      const configurations: ConfigurationInfo[] = Array.isArray(configurationsData)
        ? configurationsData
        : [];

      const options = flattenEngineOptions(generation, configurations);
      setEngineOptions(options);

      const scored: ScoredModification[] = [];
      for (const configuration of configurations) {
        for (const modification of configuration.modifications || []) {
          scored.push(scoreModification(decoded, generation, configuration, modification));
        }
      }

      const winner = chooseStrictModification(scored);

      if (winner) {
        setDraft((current) => ({
          ...current,
          engine: winner.option.value,
        }));
        setVinStatus({
          type: "success",
          text: tr(`VIN matched exactly: ${matchedMark.name} ${matchedModel.name}, model year ${verifiedYear}, generation ${generation.name}. Engine/configuration was selected only because multiple independent VIN parameters agreed with one local catalog entry.`, `VIN tiksliai sutapo: ${matchedMark.name} ${matchedModel.name}, modelio metai ${verifiedYear}, karta ${generation.name}. Variklis / komplektacija pasirinkta tik todėl, kad keli nepriklausomi VIN parametrai sutapo su vienu vietinio katalogo įrašu.`, `VIN совпал точно: ${matchedMark.name} ${matchedModel.name}, модельный год ${verifiedYear}, поколение ${generation.name}. Двигатель / комплектация выбраны только потому, что несколько независимых параметров VIN совпали с одной записью локального каталога.`),
        });
      } else {
        setVinStatus({
          type: "warning",
          text: tr(`VIN matched ${matchedMark.name} ${matchedModel.name}, model year ${verifiedYear}, generation ${generation.name}. Engine/configuration is ambiguous, so it was not guessed — choose it from the local catalog list.`, `VIN sutapo su ${matchedMark.name} ${matchedModel.name}, modelio metai ${verifiedYear}, karta ${generation.name}. Variklis / komplektacija neaiškūs, todėl jie nebuvo spėjami — pasirinkite iš vietinio katalogo sąrašo.`, `VIN совпал с ${matchedMark.name} ${matchedModel.name}, модельный год ${verifiedYear}, поколение ${generation.name}. Двигатель / комплектация неоднозначны, поэтому они не угадывались — выберите вариант из локального каталога.`),
        });
      }
    } catch (error) {
      setVinStatus({
        type: "error",
        text: error instanceof Error ? error.message : tr("VIN lookup failed.", "VIN paieška nepavyko.", "Не удалось проверить VIN."),
      });
    } finally {
      setVinLoading(false);
    }
  };

  const priceHint = usePriceHint(draft);

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
    const accepted = imageFiles.filter((file) => !currentKeys.has(photoKey(file))).slice(0, Math.max(0, 10 - photos.length));
    if (!accepted.length) return;
    setPhotos((prev) => [...prev, ...accepted].slice(0, 10));
    setDraft((d) => ({ ...d, photoNames: [...d.photoNames, ...accepted.map((f) => f.name)].slice(0, 10) }));
    accepted.forEach((file) => void classifyPhoto(file));
  };

  const setPhotoType = (file: File, label: PhotoViewType) => {
    const key = photoKey(file);
    setPhotoMeta((current) => ({
      ...current,
      [key]: { label, confidence: 1, source: "manual", loading: false },
    }));
  };

  const removePhoto = (file: File) => {
    const key = photoKey(file);
    setPhotos((current) => current.filter((item) => photoKey(item) !== key));
    setPhotoMeta((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
    setDraft((d) => ({ ...d, photoNames: d.photoNames.filter((name) => name !== file.name) }));
  };

  // Create a PENDING_PAYMENT listing, upload photos, then start checkout.
  const publish = async () => {
    setPublishError("");
    setPublishedListingId(null);

    const mark = marks.find((item) => item.name === draft.mark);
    const model = models.find((item) => item.name === draft.model);
    const selectedEngine = engineOptions.find((option) => option.value === draft.engine);
    const year = Number(draft.year);
    const mileage = Number(draft.mileage || 0);
    const price = Number(draft.price);

    if (!mark || !model || !selectedEngine || !Number.isInteger(year) || year < 1900 || !Number.isFinite(price) || price <= 0) {
      setPublishError(
        tr(
          "Complete make, model, year, engine/configuration and price before payment.",
          "Prieš mokėjimą užpildykite markę, modelį, metus, variklį / komplektaciją ir kainą.",
          "Перед оплатой заполните марку, модель, год, двигатель / комплектацию и цену."
        )
      );
      return;
    }

    if (!draft.description.trim()) {
      setPublishError(tr("Add a description before publishing.", "Pridėkite aprašymą prieš paskelbdami.", "Добавьте описание перед публикацией."));
      return;
    }

    setPublishing(true);
    try {
      const normalizedPromo = promoCode.trim().toUpperCase();
      if (normalizedPromo) {
        const validation = await validatePromoCode(normalizedPromo);
        if (!validation.valid) {
          setPromoValid(false);
          setPublishError(tr("This promo code is invalid or expired.", "Šis nuolaidos kodas neteisingas arba nebegalioja.", "Промокод неверный или больше не действует."));
          return;
        }
        setPromoValid(true);
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
      });

      // Image failure should not charge the user silently. Stop before checkout.
      for (const photo of photos.slice(0, 10)) {
        const detected = photoMeta[photoKey(photo)]?.label || "OTHER";
        await uploadListingImage(created.id, photo, detected);
      }

      const checkout = await startCheckout(created.id, normalizedPromo || undefined);
      if (checkout.promoApplied) {
        clearDraft();
        setPublishedListingId(checkout.listingId);
        return;
      }
      if (checkout.devMode) {
        window.location.href = `/payment/dev?paymentId=${checkout.paymentId}&listingId=${checkout.listingId}&amount=${checkout.amount}`;
        return;
      }
      if (!checkout.paymentUrl) throw new Error("Payment URL was not returned");
      window.location.href = checkout.paymentUrl;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/auth/login?return=/sell";
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

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`${anybody.className} text-3xl md:text-4xl font-extrabold`}>{tr("Sell a car", "Parduoti automobilį", "Продать автомобиль")}</h1>
        <div className="text-sm text-muted-foreground">
          {lastSaved
            ? `${tr("Draft saved", "Juodraštis išsaugotas", "Черновик сохранён")} ${lastSaved.toLocaleTimeString(
                language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB"
              )}`
            : tr("Draft not saved yet", "Juodraštis dar neišsaugotas", "Черновик ещё не сохранён")}
        </div>
      </div>

      {/* Степпер */}
      <Card className="p-3 md:p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {[
            tr("Car", "Automobilis", "Автомобиль"),
            tr("Photos", "Nuotraukos", "Фотографии"),
            tr("Condition", "Būklė", "Состояние"),
            tr("Price", "Kaina", "Цена"),
            tr("Contacts", "Kontaktai", "Контакты"),
            tr("Preview", "Peržiūra", "Предпросмотр"),
          ].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            return (
              <button
                key={label}
                className={cx(
                "min-h-11 touch-manipulation rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active && "bg-[hsl(var(--accent))] text-white",
                  !active && "bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))/0.8]",
                )}
                onClick={() => setStep(n)}
              >
                {n}. {label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ШАГ 1 — автомобиль */}
      {step === 1 && (
        <Card>
          <SectionTitle>{tr("Identify your car", "Nurodykite automobilį", "Определите автомобиль")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <L>{tr("Plate (LT) or VIN", "Valst. numeris (LT) arba VIN", "Госномер (LT) или VIN")}</L>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. ABC123 / WBAXX..."
                  value={draft.plateOrVin}
                  onChange={(e) => {
                    setDraft({ ...draft, plateOrVin: e.target.value });
                    if (vinStatus) setVinStatus(null);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={autofillByVin}
                  disabled={vinLoading}
                >
                  {vinLoading ? tr("Checking...", "Tikrinama...", "Проверка...") : tr("Autofill", "Užpildyti automatiškai", "Заполнить автоматически")}
                </Button>
              </div>

              {vinStatus && (
                <div
                  className={cx(
                    "mt-2 rounded-lg px-3 py-2 text-sm",
                    vinStatus.type === "success"
                      ? "bg-green-50 text-green-700"
                      : vinStatus.type === "warning"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {vinStatus.text}
                </div>
              )}

              <p className="mt-2 text-sm text-muted-foreground">
                {tr("VIN autofill uses the public NHTSA vPIC decoder. Lithuanian plate lookup can be connected separately.", "VIN automatinis užpildymas naudoja viešą NHTSA vPIC dekoderį. Lietuvos valstybinių numerių paiešką galima prijungti atskirai.", "Автозаполнение VIN использует публичный декодер NHTSA vPIC. Поиск по литовскому госномеру можно подключить отдельно.")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <L>{tr("Mark", "Markė", "Марка")}</L>
                <Select
                  value={draft.mark}
                  disabled={catalogLoading}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      mark: e.target.value,
                      model: "",
                      engine: "",
                    })
                  }
                >
                  <option value="">
                    {catalogLoading ? tr("Loading makes...", "Kraunamos markės...", "Загрузка марок...") : tr("Any", "Bet kuri", "Любая")}
                  </option>
                  {draft.mark && !marks.some((mark) => mark.name === draft.mark) && (
                    <option value={draft.mark}>{draft.mark}</option>
                  )}
                  {marks.map((mark) => (
                    <option key={mark.id} value={mark.name}>
                      {mark.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <L>{tr("Model", "Modelis", "Модель")}</L>
                <Select
                  value={draft.model}
                  disabled={!draft.mark || modelsLoading}
                  onChange={(e) =>
                    setDraft({ ...draft, model: e.target.value, engine: "" })
                  }
                >
                  <option value="">
                    {!draft.mark
                      ? tr("Choose a make first", "Pirmiausia pasirinkite markę", "Сначала выберите марку")
                      : modelsLoading
                      ? tr("Loading models...", "Kraunami modeliai...", "Загрузка моделей...")
                      : tr("Any", "Bet kuris", "Любая")}
                  </option>
                  {draft.model && !models.some((model) => model.name === draft.model) && (
                    <option value={draft.model}>{draft.model}</option>
                  )}
                  {models.map((model) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <L>{tr("Model year", "Modelio metai", "Модельный год")}</L>
              <Input
                placeholder="2017"
                value={draft.year}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    year: e.target.value.replace(/\D+/g, "").slice(0, 4),
                    engine: "",
                  })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {tr("VIN provides the model year. The first registration year can be different.", "VIN nurodo modelio metus. Pirmos registracijos metai gali skirtis.", "VIN указывает модельный год. Год первой регистрации может отличаться.")}
              </p>
              {matchedGeneration && (
                <p className="mt-1 text-xs text-green-700">
                  {tr("Local catalog generation:", "Vietinio katalogo karta:", "Поколение в локальном каталоге:")} {matchedGeneration.name}
                  {matchedGeneration.yearStart || matchedGeneration.yearStop
                    ? ` (${matchedGeneration.yearStart ?? "?"}–${matchedGeneration.yearStop ?? "present"})`
                    : ""}
                </p>
              )}
              {generationCandidates.length > 1 && (
                <p className="mt-1 text-xs text-amber-700">
                  {tr("This year overlaps several generations:", "Šie metai sutampa su keliomis kartomis:", "Этот год пересекается с несколькими поколениями:")} {generationCandidates.map((g) => g.name).join(", ")}.{" "}
                  {tr("Engine/configuration will not be guessed automatically.", "Variklis / komplektacija nebus parinkta automatiškai.", "Двигатель / комплектация не будут угаданы автоматически.")}
                </p>
              )}
            </div>

            <div>
              <L>{tr("Engine / configuration", "Variklis / komplektacija", "Двигатель / комплектация")}</L>
              {configurationLoading ? (
                <Input value={tr("Loading local configurations...", "Kraunamos vietinės komplektacijos...", "Загрузка комплектаций...")} disabled />
              ) : engineOptions.length > 0 ? (
                <Select
                  value={draft.engine}
                  onChange={(e) => setDraft({ ...draft, engine: e.target.value })}
                >
                  <option value="">{tr("Choose configuration", "Pasirinkite komplektaciją", "Выберите комплектацию")}</option>
                  {draft.engine && !engineOptions.some((option) => option.value === draft.engine) && (
                    <option value={draft.engine}>{draft.engine}</option>
                  )}
                  {engineOptions.map((option) => (
                    <option
                      key={`${option.configurationId}:${option.modificationId}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  placeholder={tr("Choose mark, model and model year first", "Pirmiausia pasirinkite markę, modelį ir modelio metus", "Сначала выберите марку, модель и модельный год")}
                  value={draft.engine}
                  onChange={(e) => setDraft({ ...draft, engine: e.target.value })}
                />
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {tr("Autofill selects a configuration only when the VIN and the local catalog agree on at least two independent engine facts and there is one clear match.", "Komplektacija parenkama automatiškai tik tada, kai VIN ir vietinis katalogas sutampa bent pagal du nepriklausomus variklio parametrus ir yra vienas aiškus atitikmuo.", "Комплектация выбирается автоматически только если VIN и локальный каталог совпадают минимум по двум независимым параметрам двигателя и есть одно однозначное совпадение.")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(2)}>
              {tr("Skip", "Praleisti", "Пропустить")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setStep(2)}>{tr("Next", "Toliau", "Далее")}</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 2 — фото */}
      {step === 2 && (
        <Card>
          <SectionTitle>{tr("Photos & video", "Nuotraukos ir vaizdo įrašas", "Фото и видео")}</SectionTitle>
          <p className="mb-4 text-sm text-muted-foreground">
            {tr("Add key angles to increase trust. We’ll help you with a checklist.", "Pridėkite svarbiausius rakursus, kad skelbimas keltų daugiau pasitikėjimo. Padėsime kontroliniu sąrašu.", "Добавьте основные ракурсы, чтобы объявление вызывало больше доверия. Мы дадим чек-лист.")}
          </p>
          <p className="-mt-2 mb-4 text-xs text-muted-foreground">{tr("When AI photo recognition is configured, each uploaded photo is classified automatically. You can always correct the angle manually.", "Kai sukonfigūruotas AI nuotraukų atpažinimas, kiekvienas vaizdas klasifikuojamas automatiškai. Rakursą visada galima pataisyti rankiniu būdu.", "Когда настроено AI-распознавание, каждое фото классифицируется автоматически. Ракурс всегда можно исправить вручную.")}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div
                className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  addPhotos(files);
                }}
              >
                <div className="text-center">
                  <div className={`${anybody.className} mb-2 text-lg font-bold`}>{tr("Drop photos here", "Nutempkite nuotraukas čia", "Перетащите фотографии сюда")}</div>
                  <div className="text-sm text-muted-foreground">{tr("or use the button below", "arba naudokite mygtuką žemiau", "или используйте кнопку ниже")}</div>
                </div>
              </div>

              <div className="mt-3">
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    addPhotos(files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <Button as="label" htmlFor="photo-input" className="cursor-pointer">
                  {tr("Upload from device", "Įkelti iš įrenginio", "Загрузить с устройства")}
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {photos.map((f) => {
                    const key = photoKey(f);
                    const meta = photoMeta[key] || { label: "OTHER" as PhotoViewType, confidence: 0, source: "manual", loading: false };
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={key} className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
                        <div className="relative h-32 bg-muted">
                          <img src={url} alt={f.name} className="absolute inset-0 h-full w-full object-cover" />
                          <button type="button" onClick={() => removePhoto(f)} className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">×</button>
                          <div className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 text-xs font-semibold text-white">
                            {meta.loading ? tr("Detecting…", "Atpažįstama…", "Распознаём…") : photoTypeLabel(meta.label)}
                          </div>
                        </div>
                        <div className="p-2">
                          <select
                            value={meta.label}
                            onChange={(e) => setPhotoType(f, e.target.value as PhotoViewType)}
                            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                          >
                            {(["FRONT","REAR","LEFT_SIDE","RIGHT_SIDE","INTERIOR","DASHBOARD","VIN_PLATE","OTHER"] as PhotoViewType[]).map((type) => (
                              <option key={type} value={type}>{photoTypeLabel(type)}</option>
                            ))}
                          </select>
                          {meta.source === "openai" && !meta.loading && (
                            <div className="mt-1 text-[11px] text-muted-foreground">AI · {Math.round(meta.confidence * 100)}%</div>
                          )}
                          {meta.error && <div className="mt-1 text-[11px] text-amber-600">{meta.error}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className={`${anybody.className} mb-2 text-base font-bold`}>{tr("Checklist", "Kontrolinis sąrašas", "Чек-лист")}</div>
              <ul className="space-y-2 text-sm">
                {(["FRONT","REAR","LEFT_SIDE","RIGHT_SIDE","INTERIOR","DASHBOARD","VIN_PLATE"] as PhotoViewType[]).map((type) => {
                  const done = Object.values(photoMeta).some((meta) => meta.label === type && !meta.loading);
                  return (
                    <li key={type} className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-500" : "bg-[hsl(var(--accent))]"}`} />
                      <span className={done ? "font-semibold text-emerald-500" : ""}>{photoTypeLabel(type)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 text-xs text-muted-foreground">
                {tr("Tip: we can mask plates later for privacy.", "Patarimas: dėl privatumo valstybinius numerius vėliau galima užmaskuoti.", "Совет: позже можно скрыть номера автомобиля для приватности.")}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(3)}>
              {tr("Skip", "Praleisti", "Пропустить")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setStep(3)}>{tr("Next", "Toliau", "Далее")}</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 3 — состояние/комплектация */}
      {step === 3 && (
        <Card>
          <SectionTitle>{tr("Condition & equipment", "Būklė ir įranga", "Состояние и комплектация")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>{tr("Mileage", "Rida", "Пробег")}</L>
              <Input
                placeholder="145 000"
                value={draft.mileage}
                onChange={(e) => setDraft({ ...draft, mileage: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div>
              <L>{tr("Owners", "Savininkai", "Владельцы")}</L>
              <Input
                placeholder="1"
                value={draft.owners}
                onChange={(e) => setDraft({ ...draft, owners: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div className="flex items-end gap-3">
              <input
                id="service-book"
                type="checkbox"
                checked={draft.hasServiceBook}
                onChange={(e) => setDraft({ ...draft, hasServiceBook: e.target.checked })}
                className="h-5 w-5 rounded border-[hsl(var(--border))]"
              />
              <label htmlFor="service-book" className="text-sm">{tr("Has service book / docs", "Yra serviso knygelė / dokumentai", "Есть сервисная книжка / документы")}</label>
            </div>

            <div>
              <L>{tr("Next service until", "Kitas aptarnavimas iki", "Следующее ТО до")}</L>
              <Input
                type="date"
                value={draft.nextServiceDate}
                onChange={(e) => setDraft({ ...draft, nextServiceDate: e.target.value })}
              />
            </div>

            <div>
              <L>{tr("Condition", "Būklė", "Состояние")}</L>
              <Select
                value={draft.condition}
                onChange={(e) => setDraft({ ...draft, condition: e.target.value as ListingDraft["condition"] })}
              >
                <option value="clean">{tr("Not crashed", "Nedaužtas", "Не бит")}</option>
                <option value="minor">{tr("Minor paint", "Smulkūs dažymo darbai", "Небольшие окрасы")}</option>
                <option value="damaged">{tr("Crashed", "Daužtas", "Бит")}</option>
                <option value="needs_repair">{tr("Needs repair", "Reikia remonto", "Требует ремонта")}</option>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <L>{tr("Features", "Įranga", "Опции")}</L>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {FEATURE_DEFS.map((feature) => {
                const checked = draft.features.includes(feature.value);
                return (
                  <label key={feature.value} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setDraft((d) => ({
                          ...d,
                          features: e.target.checked
                            ? [...d.features, feature.value]
                            : d.features.filter((x) => x !== feature.value),
                        }));
                      }}
                      className="h-4 w-4 rounded border-[hsl(var(--border))]"
                    />
                    <span className="text-sm">{tr(feature.en, feature.lt, feature.ru)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <L>{tr("Description", "Aprašymas", "Описание")}</L>
            <Textarea
              placeholder={tr("Tell about condition, maintenance, what you like about the car...", "Aprašykite būklę, priežiūrą ir kas jums patinka šiame automobilyje...", "Расскажите о состоянии, обслуживании и о том, что вам нравится в автомобиле...")}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(4)}>
              {tr("Skip", "Praleisti", "Пропустить")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setStep(4)}>{tr("Next", "Toliau", "Далее")}</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 4 — цена */}
      {step === 4 && (
        <Card>
          <SectionTitle>{tr("Price & strategy", "Kaina ir pardavimo strategija", "Цена и стратегия продажи")}</SectionTitle>

          {priceHint && (
            <div className="mb-4 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">
              {tr("Recommended:", "Rekomenduojama:", "Рекомендуется:")} <strong>{formatEUR(priceHint.low)} – {formatEUR(priceHint.high)}</strong>
              <div className="text-[12px] text-muted-foreground">
                {tr("Based on similar cars and year.", "Pagal panašius automobilius ir metus.", "На основе похожих автомобилей и года.")}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>{tr("Price", "Kaina", "Цена")}</L>
              <Input
                placeholder="12000"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div>
              <L>{tr("Strategy", "Strategija", "Стратегия")}</L>
              <Select
                value={draft.strategy}
                onChange={(e) => setDraft({ ...draft, strategy: e.target.value as ListingDraft["strategy"] })}
              >
                <option value="fixed">{tr("Fixed", "Fiksuota", "Фиксированная")}</option>
                <option value="negotiable">{tr("Negotiable", "Derinama", "Договорная")}</option>
                <option value="quick">{tr("Quick sale", "Greitas pardavimas", "Быстрая продажа")}</option>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <input
                id="bargain"
                type="checkbox"
                checked={draft.allowBargain}
                onChange={(e) => setDraft({ ...draft, allowBargain: e.target.checked })}
                className="h-5 w-5 rounded border-[hsl(var(--border))]"
              />
              <label htmlFor="bargain" className="text-sm">{tr("Allow small bargain", "Leisti nedideles derybas", "Разрешить небольшой торг")}</label>
            </div>
          </div>

          {/* простая подсказка времени продажи */}
          {!!draft.price && priceHint && (
            <div className="mt-3 text-sm text-muted-foreground">
              {tr("With this price, expected time to sell ~", "Su šia kaina numatomas pardavimo laikas ~", "С этой ценой ожидаемый срок продажи ~")}{" "}
              <strong>
                {Number(draft.price) <= priceHint.low
                  ? tr("5–7 days", "5–7 dienos", "5–7 дней")
                  : Number(draft.price) <= priceHint.high
                  ? tr("1–2 weeks", "1–2 savaitės", "1–2 недели")
                  : tr("2–4 weeks", "2–4 savaitės", "2–4 недели")}
              </strong>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(5)}>
              {tr("Skip", "Praleisti", "Пропустить")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setStep(5)}>{tr("Next", "Toliau", "Далее")}</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 5 — контакты/расписание */}
      {step === 5 && (
        <Card>
          <SectionTitle>{tr("Contacts & schedule", "Kontaktai ir laikas", "Контакты и время")}</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>{tr("City", "Miestas", "Город")}</L>
              <Input
                placeholder="Vilnius"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
            <div>
              <L>{tr("Area / district", "Rajonas", "Район")}</L>
              <Input
                placeholder="Antakalnis"
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
              />
            </div>
            <div>
              <L>{tr("Phone", "Telefonas", "Телефон")}</L>
              <Input
                placeholder="+370..."
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <L>{tr("Preferred contact methods", "Pageidaujami susisiekimo būdai", "Предпочтительные способы связи")}</L>
            <div className="flex flex-wrap gap-2">
              {(["chat", "phone", "whatsapp", "telegram"] as ContactMethod[]).map((m) => {
                const on = draft.contactMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={cx(
                      "rounded-full px-3 py-1 text-sm ring-1",
                      on
                        ? "bg-[hsl(var(--accent))] text-white ring-transparent"
                        : "bg-[hsl(var(--muted))] text-foreground ring-[hsl(var(--border))]"
                    )}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        contactMethods: on
                          ? d.contactMethods.filter((x) => x !== m)
                          : [...d.contactMethods, m],
                      }))
                    }
                  >
                    {m === "chat" ? tr("Chat", "Pokalbis", "Чат") : m === "phone" ? tr("Phone", "Telefonas", "Телефон") : m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <L>{tr("Weekdays time", "Laikas darbo dienomis", "Время в будни")}</L>
              <Input
                placeholder="e.g. 18:00–21:00"
                value={draft.viewingWeekdays}
                onChange={(e) => setDraft({ ...draft, viewingWeekdays: e.target.value })}
              />
            </div>
            <div>
              <L>{tr("Weekend time", "Laikas savaitgaliais", "Время в выходные")}</L>
              <Input
                placeholder={tr("e.g. by arrangement", "pvz., susitarus", "например, по договорённости")}
                value={draft.viewingWeekend}
                onChange={(e) => setDraft({ ...draft, viewingWeekend: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setStep(6)}>
              {tr("Skip", "Praleisti", "Пропустить")}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setStep(6)}>{tr("Next", "Toliau", "Далее")}</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 6 — предпросмотр/публикация */}
      {step === 6 && (
        <Card>
          <SectionTitle>{tr("Preview & publish", "Peržiūra ir paskelbimas", "Предпросмотр и публикация")}</SectionTitle>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl ring-1 ring-[hsl(var(--border))] overflow-hidden bg-white">
              <div className="relative h-56 bg-[hsl(var(--muted))]">
                {photos[0] ? (
                  <img
                    src={URL.createObjectURL(photos[0])}
                    alt="preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="https://placehold.co/800x600/png"
                    alt="placeholder"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className={`${anybody.className} text-[15px] font-bold`}>
                  {draft.mark || tr("Car", "Automobilis", "Автомобиль")} {draft.model} {draft.year && `(${draft.year})`}
                </h3>
                <div className={`${anybody.className} mt-2 text-base font-bold text-[hsl(var(--accent))]`}>
                  {draft.price ? `${Number(draft.price).toLocaleString()} €` : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div><strong>{tr("Engine:", "Variklis:", "Двигатель:")}</strong> {draft.engine || "—"}</div>
              <div><strong>{tr("Mileage:", "Rida:", "Пробег:")}</strong> {draft.mileage ? `${draft.mileage} km` : "—"}</div>
              <div><strong>{tr("Condition:", "Būklė:", "Состояние:")}</strong> {draft.condition}</div>
              <div><strong>{tr("Features:", "Įranga:", "Опции:")}</strong> {draft.features.length ? draft.features.join(", ") : "—"}</div>
              <div><strong>{tr("City/Area:", "Miestas / rajonas:", "Город / район:")}</strong> {[draft.city, draft.area].filter(Boolean).join(", ") || "—"}</div>
              <div><strong>{tr("Contacts:", "Kontaktai:", "Контакты:")}</strong> {draft.contactMethods.join(", ") || tr("chat only", "tik pokalbis", "только чат")} {draft.phone && `(${draft.phone})`}</div>
              {priceHint && (
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <div>{tr("Recommended range:", "Rekomenduojamas intervalas:", "Рекомендуемый диапазон:")} <strong>{formatEUR(priceHint.low)}–{formatEUR(priceHint.high)}</strong></div>
                </div>
              )}
              {draft.description && (
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <div className="font-medium mb-1">{tr("Description", "Aprašymas", "Описание")}</div>
                  <div className="whitespace-pre-wrap">{draft.description}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[hsl(var(--accent))]/40 bg-[hsl(var(--muted))] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-bold">{tr("Listing publication", "Skelbimo publikavimas", "Размещение объявления")}</div>
                <div className="text-sm text-muted-foreground">
                  {tr(
                    promoValid ? "With this promo code, the listing is published for free." : "The listing becomes public only after confirmed payment.",
                    promoValid ? "Su šiuo kodu skelbimas paskelbiamas nemokamai." : "Skelbimas tampa viešas tik patvirtinus mokėjimą.",
                    promoValid ? "С этим промокодом объявление публикуется бесплатно." : "Объявление станет публичным только после подтверждённой оплаты."
                  )}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[hsl(var(--accent))]">
                {promoValid ? `0.00 ${paymentConfig?.currency || "EUR"}` : paymentConfig ? `${paymentConfig.publicationPrice.toFixed(2)} ${paymentConfig.currency}` : "4.99 EUR"}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium">
                {tr("Promo code", "Nuolaidos kodas", "Промокод")}
                <input
                  value={promoCode}
                  onChange={(event) => { setPromoCode(event.target.value); setPromoValid(false); setPublishError(""); }}
                  placeholder={tr("Enter promo code", "Įveskite kodą", "Введите промокод")}
                  autoComplete="off"
                  maxLength={64}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!promoCode.trim() || promoChecking || publishing}
                loading={promoChecking}
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
                {tr("Apply", "Taikyti", "Применить")}
              </Button>
            </div>
            {promoValid && <div className="mt-2 text-sm font-semibold text-green-600">{tr("Code applied — this listing is free.", "Kodas pritaikytas — skelbimas nemokamas.", "Промокод применён — публикация бесплатна.")}</div>}
            {paymentConfig?.devMode && (
              <div className="mt-2 text-xs font-bold text-amber-600">
                DEV MODE — {tr("test payment is enabled", "įjungtas bandomasis mokėjimas", "включена тестовая оплата")}
              </div>
            )}
            {publishError && <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{publishError}</div>}
            {publishedListingId && <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-sm font-semibold text-green-700">{tr("Your listing is published for free!", "Skelbimas paskelbtas nemokamai!", "Объявление опубликовано бесплатно!")} <a className="underline" href={`/listing/${publishedListingId}`}>{tr("Open listing", "Atidaryti skelbimą", "Открыть объявление")}</a></div>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => { clearDraft(); setDraft(INITIAL); setPhotos([]); }}>
              {tr("Clear draft", "Išvalyti juodraštį", "Очистить черновик")}
            </Button>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setStep(1)}>{tr("Edit", "Redaguoti", "Редактировать")}</Button>
              <Button className="w-full sm:w-auto" onClick={publishedListingId ? () => { window.location.href = "/account/listings"; } : publish} loading={publishing} disabled={publishing}>
                {publishedListingId ? tr("My listings", "Mano skelbimai", "Мои объявления") : promoValid ? tr("Publish for free", "Paskelbti nemokamai", "Опубликовать бесплатно") : tr("Pay & publish", "Mokėti ir paskelbti", "Оплатить и опубликовать")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
