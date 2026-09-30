/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import IconSelect from "@/components/IconSelect";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import CarCard from "@/components/CarCard";
import Button from "@/components/Button";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import { getFavorites, getPublicListingCount, getPublicListings } from "@/lib/listings";
import { addFavorite, me, removeFavorite } from "@/lib/pirkApi";
import type { Listing, ListingsQuery } from "@/lib/listings";
import { useLanguage } from "@/context/LanguageContext";
import { BACKEND_ORIGIN } from "@/lib/config";
import AssetIcon from "@/components/ui/AssetIcon";

const ANY = "__ANY__";

const DEFAULTS = {
  mark: ANY,
  model: ANY,
  reg: ANY,
  mileage: ANY,
  priceMin: 0,
  priceMax: 100_000,
};

const PAGE_SIZE = 12;
const BACKEND_URL = BACKEND_ORIGIN;
const CAR_API = `${BACKEND_ORIGIN}/cars`;

type CarMark = {
  id: string;
  name: string;
};

type CarModel = {
  id: string;
  name: string;
};

const FALLBACK_CAR_IMAGE = "/images/no-photo.svg";

function resolveListingImage(value?: string | null) {
  if (!value) return FALLBACK_CAR_IMAGE;
  const url = value.trim();
  if (!url) return FALLBACK_CAR_IMAGE;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function HomePage() {
  const { t, tr, language } = useLanguage();
  const anyLabel = t("any");

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [selectedMark, setSelectedMark] = useState(DEFAULTS.mark);
  const [selectedModel, setSelectedModel] = useState(DEFAULTS.model);
  const [selectedRegistration, setSelectedRegistration] = useState(DEFAULTS.reg);
  const [selectedMileage, setSelectedMileage] = useState(DEFAULTS.mileage);

  const [priceMin, setPriceMin] = useState<number>(DEFAULTS.priceMin);
  const [priceMax, setPriceMax] = useState<number>(DEFAULTS.priceMax);
  const [resetToken, setResetToken] = useState(0);

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [doors, setDoors] = useState("ANY");
  const [transmission, setTransmission] = useState("ANY");
  const [category, setCategory] = useState("ANY");
  const [fuel, setFuel] = useState("ANY");
  const [powerMin, setPowerMin] = useState(0);
  const [sort, setSort] = useState("newest");
  const [appliedQuery, setAppliedQuery] = useState<ListingsQuery>({ sort: "newest" });

  const [markOptions, setMarkOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [markIdByName, setMarkIdByName] = useState<Record<string, string>>({});
  const [mobilePicker, setMobilePicker] = useState<"mark" | "model" | null>(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);
  const [matchingCount, setMatchingCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  const registrationOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: ANY, label: anyLabel },
      ...Array.from({ length: currentYear - 1979 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) })),
    ];
  }, [anyLabel]);

  const mileageOptions = useMemo(
    () => [
      { value: ANY, label: anyLabel },
      ...[25_000, 50_000, 100_000, 150_000, 200_000, 250_000].map((km) => ({
        value: String(km),
        label: `${km.toLocaleString("lt-LT")} km`,
      })),
    ],
    [anyLabel]
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  // Filters beyond make and model; the mobile count endpoint only knows make and model.
  const extraFilterCount = [
    selectedRegistration !== ANY,
    selectedMileage !== ANY,
    priceMin > DEFAULTS.priceMin || priceMax < DEFAULTS.priceMax,
    doors !== "ANY",
    transmission !== "ANY",
    category !== "ANY",
    fuel !== "ANY",
    powerMin > 0,
    sort !== "newest",
  ].filter(Boolean).length;

  const filteredPickerOptions = useMemo(() => {
    const options = mobilePicker === "model" ? modelOptions : markOptions;
    const needle = mobileSearch.trim().toLocaleLowerCase();
    return needle ? options.filter((name) => name.toLocaleLowerCase().includes(needle)) : options;
  }, [markOptions, modelOptions, mobilePicker, mobileSearch]);

  const mobileMakeLabel = tr("Make", "Markė", "Марка");
  const mobileModelLabel = tr("Model", "Modelis", "Модель");
  const mobileShowListingsLabel = tr("View listings", "Žiūrėti skelbimus", "Смотреть объявления");
  const mobileCountLabel = new Intl.NumberFormat(language === "RU" ? "ru-RU" : language === "LT" ? "lt-LT" : "en-US").format(matchingCount);

  useEffect(() => {
    let cancelled = false;

    const loadMarks = async () => {
      try {
        const response = await fetch(`${CAR_API}?size=500`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load marks: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) return;

        const marks: CarMark[] = Array.isArray(data?.content)
          ? data.content
          : [];

        const validMarks = marks.filter(
          (mark) =>
            typeof mark?.id === "string" &&
            typeof mark?.name === "string" &&
            mark.name.trim().length > 0
        );

        setMarkOptions(validMarks.map((mark) => mark.name));

        setMarkIdByName(
          Object.fromEntries(
            validMarks.map((mark) => [mark.name, mark.id])
          )
        );
      } catch (error) {
        console.error("Error loading marks:", error);

        if (!cancelled) {
          setMarkOptions([]);
          setMarkIdByName({});
        }
      }
    };

    loadMarks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedModel(ANY);

    if (selectedMark === ANY) {
      setModelOptions([]);
      setModelsLoading(false);
      return;
    }

    const markId = markIdByName[selectedMark];

    if (!markId) {
      setModelOptions([]);
      setModelsLoading(false);
      return;
    }

    let cancelled = false;
    setModelOptions([]);
    setModelsLoading(true);

    const loadModels = async () => {
      try {
        const response = await fetch(
          `${CAR_API}/${encodeURIComponent(markId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Failed to load models: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) return;

        const models: CarModel[] = Array.isArray(data) ? data : [];

        const names = models
          .map((model) => model?.name?.trim())
          .filter((name): name is string => Boolean(name));

        setModelOptions(names);
        setModelsLoading(false);
      } catch (error) {
        console.error("Error loading models:", error);

        if (!cancelled) {
          setModelOptions([]);
          setModelsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [selectedMark, markIdByName]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCountLoading(true);
      try {
        const count = await getPublicListingCount({
          mark: selectedMark !== ANY ? selectedMark : undefined,
          model: selectedModel !== ANY ? selectedModel : undefined,
        });
        if (!cancelled) setMatchingCount(count);
      } catch {
        if (!cancelled) setMatchingCount(0);
      } finally {
        if (!cancelled) setCountLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedMark, selectedModel]);

  useEffect(() => {
    if (!mobilePicker && !mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobilePicker(null);
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobilePicker, mobileFiltersOpen]);

  useEffect(() => {
    let alive = true;
    me()
      .then(async () => {
        if (!alive) return;
        setLoggedIn(true);
        const favorites = await getFavorites();
        if (alive) setFavoriteIds(new Set(favorites.map((x) => x.id)));
      })
      .catch(() => {
        /* guests see the heart and are sent to sign in */
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    if (!loggedIn) {
      window.location.href = "/auth/login?return=/";
      return;
    }
    const wasFavorite = favoriteIds.has(id);
    const next = (add: boolean) =>
      setFavoriteIds((prev) => {
        const copy = new Set(prev);
        if (add) copy.add(id);
        else copy.delete(id);
        return copy;
      });
    next(!wasFavorite);
    try {
      if (wasFavorite) await removeFavorite(id);
      else await addFavorite(id);
    } catch {
      next(wasFavorite);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const data = await getPublicListings({
          limit: PAGE_SIZE,
          offset: 0,
        });

        if (cancelled) return;

        setItems(data);
        setHasMore(data.length >= PAGE_SIZE);
        setOffset(data.length);
      } catch {
        if (!cancelled) {
          setItems([]);
          setHasMore(false);
          setOffset(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const buildQuery = (): ListingsQuery => ({
    mark: selectedMark !== ANY ? selectedMark : undefined,
    model: selectedModel !== ANY ? selectedModel : undefined,
    reg: selectedRegistration !== ANY ? selectedRegistration : undefined,
    mileage: selectedMileage !== ANY ? selectedMileage : undefined,
    priceMin,
    priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
    doors: doors !== "ANY" ? doors : undefined,
    transmission: transmission !== "ANY" ? transmission : undefined,
    category: category !== "ANY" ? category : undefined,
    fuel: fuel !== "ANY" ? fuel : undefined,
    powerMin: powerMin > 0 ? powerMin : undefined,
    sort,
  });

  const scrollToResults = () =>
    window.setTimeout(() => document.getElementById("listings-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const applyFilters = async () => {
    setSearching(true);
    setSearched(true);
    const query = buildQuery();

    try {
      const data = await getPublicListings({
        ...query,
        limit: PAGE_SIZE,
        offset: 0,
      });

      // Remember exactly the filters/sorting that produced the visible result.
      // “Load more” will continue the same query even if controls are changed later.
      setAppliedQuery(query);
      setItems(data);
      setHasMore(data.length >= PAGE_SIZE);
      setOffset(data.length);
    } catch {
      setAppliedQuery(query);
      setItems([]);
      setHasMore(false);
      setOffset(0);
    } finally {
      setSearching(false);
    }
  };

  const showMobileListings = async () => {
    if (mobilePicker === "mark" && selectedMark !== ANY) {
      setSelectedModel(ANY);
      setMobileSearch("");
      setMobilePicker("model");
      return;
    }
    setMobilePicker(null);
    setMobileFiltersOpen(false);
    await applyFilters();
    scrollToResults();
  };

  const loadMore = async () => {
    if (!hasMore || fetchingMore) return;

    setFetchingMore(true);

    try {
      const more = await getPublicListings({
        ...appliedQuery,
        limit: PAGE_SIZE,
        offset,
      });

      if (more.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...more]);
        setOffset((prev) => prev + more.length);
        setHasMore(more.length >= PAGE_SIZE);
      }
    } finally {
      setFetchingMore(false);
    }
  };

  const handleReset = () => {
    setSelectedMark(ANY);
    setSelectedModel(ANY);
    setSelectedRegistration(ANY);
    setSelectedMileage(ANY);
    setDoors("ANY");
    setTransmission("ANY");
    setCategory("ANY");
    setFuel("ANY");
    setPowerMin(0);
    setSort("newest");
    setPriceMin(DEFAULTS.priceMin);
    setPriceMax(DEFAULTS.priceMax);
    setResetToken((value) => value + 1);
  };

  // Results are rendered exactly as returned by the backend after the user
  // presses “Find listings”. No mock cards and no hidden client-side reordering.
  const markSelectOptions = [
    { value: ANY, label: anyLabel },
    ...markOptions.map((name) => ({ value: name, label: name })),
  ];
  const modelSelectOptions = [
    { value: ANY, label: modelsLoading ? tr("Loading…", "Įkeliama…", "Загрузка…") : anyLabel },
    ...modelOptions.map((name) => ({ value: name, label: name })),
  ];

  const doorOptions: Array<[string, string]> = [
    ["2_3", "2/3"],
    ["4_5", "4/5"],
  ];
  const transmissionOptions: Array<[string, string]> = [
    ["AUTO", tr("Automatic", "Automatinė", "Автомат")],
    ["MANUAL", tr("Manual", "Mechaninė", "Механика")],
  ];
  const bodyOptions: Array<[string, string]> = [
    ["saloon", tr("Saloon", "Sedanas", "Седан")],
    ["hatchback", tr("Hatchback", "Hečbekas", "Хэтчбек")],
    ["estate", tr("Estate", "Universalas", "Универсал")],
    ["suv", "SUV"],
    ["coupe", tr("Sports / coupe", "Sportinis / kupė", "Спорт / купе")],
    ["cabriolet", tr("Cabriolet", "Kabrioletas", "Кабриолет")],
    ["small", tr("Small car", "Mažas automobilis", "Малый автомобиль")],
  ];
  const fuelOptions: Array<[string, string]> = [
    ["PETROL", tr("Petrol", "Benzinas", "Бензин")],
    ["DIESEL", tr("Diesel", "Dyzelinas", "Дизель")],
    ["GAS", tr("Gas", "Dujos", "Газ")],
    ["ELECTRO", tr("Electric", "Elektra", "Электро")],
  ];
  const powerOptions = [
    { value: "0", label: tr("Any power", "Bet kokia galia", "Любая мощность") },
    ...[75, 100, 150, 200, 300].map((kw) => ({ value: String(kw), label: `${kw} kW+` })),
  ];
  const sortOptions = [
    { value: "newest", label: tr("Newest first", "Naujausi pirmiausia", "Сначала новые") },
    { value: "price_asc", label: tr("Price: low to high", "Kaina: nuo mažiausios", "Цена: по возрастанию") },
    { value: "price_desc", label: tr("Price: high to low", "Kaina: nuo didžiausios", "Цена: по убыванию") },
    { value: "oldest", label: tr("Oldest first", "Seniausi pirmiausia", "Сначала старые") },
    { value: "mileage_asc", label: tr("Mileage: low to high", "Rida: nuo mažiausios", "Пробег: по возрастанию") },
    { value: "mileage_desc", label: tr("Mileage: high to low", "Rida: nuo didžiausios", "Пробег: по убыванию") },
    { value: "year_desc", label: tr("Year: newest first", "Metai: naujausi pirmiausia", "Год: сначала новые") },
    { value: "year_asc", label: tr("Year: oldest first", "Metai: seniausi pirmiausia", "Год: сначала старые") },
  ];

  const yearLabel = tr("Year", "Metai", "Год выпуска");

  const mobileSelectClass =
    "h-12 w-full appearance-none rounded-xl border border-border bg-muted px-4 text-base font-semibold text-foreground outline-none focus:border-accent";

  return (
    <div>
      <section className="relative">
        <div className="relative h-[420px] overflow-hidden rounded-2xl sm:h-[500px] md:h-[600px] md:rounded-none lg:h-[620px]">
          <img
            src="/images/hero.jpg"
            alt="Wheelio"
            className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
            loading="eager"
          />

          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/60 to-transparent sm:w-[75%] md:w-[60%]" />
          <div className="absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-black/60 to-transparent md:block" />

          <div className="container relative pt-6 md:pt-24 lg:pt-28">
            <p className="mb-4 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 md:flex">
              <span className="h-px w-8 bg-white/70" />
              {tr("Thousands of listings in one place", "Tūkstančiai skelbimų vienoje vietoje", "Тысячи объявлений в одном месте")}
            </p>
            <h1 className="max-w-[640px] text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
              {tr("Buy or sell a car", "Pirk ar parduok automobilį", "Купи или продай автомобиль")}{" "}
              <span className="text-accent">{tr("easily", "lengvai", "легко")}</span>
            </h1>
            <p className="mt-5 hidden max-w-[440px] text-base leading-7 text-white/80 md:block md:text-lg">
              {tr(
                "A reliable platform for buying and selling cars in Lithuania and Europe.",
                "Patikima platforma automobiliams pirkti ir parduoti Lietuvoje ir Europoje.",
                "Надёжная платформа для покупки и продажи автомобилей в Литве и Европе."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="relative z-10 -mt-[88px] sm:-mt-[140px] md:-mt-[150px]">
          {/* Mobile: make → model picker, plus a filters sheet */}
          <div className="mb-4 rounded-3xl bg-card p-4 shadow-xl ring-1 ring-border md:hidden">
            <div className="mb-3">
              <p className="text-lg font-extrabold text-foreground">{tr("Find your car", "Raskite automobilį", "Найдите свой автомобиль")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tr("Choose a make, then a model", "Pasirinkite markę, tada modelį", "Сначала выберите марку, затем модель")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMobileSearch(""); setMobilePicker("mark"); }} className="min-h-14 rounded-2xl border border-border bg-muted px-3 py-2 text-left active:scale-[0.99]">
                <span className="block text-xs font-medium text-muted-foreground">{mobileMakeLabel}</span>
                <span className="mt-1 block truncate text-sm font-bold text-foreground">{selectedMark === ANY ? tr("Choose make", "Pasirinkite markę", "Выберите марку") : selectedMark}</span>
              </button>
              <button type="button" disabled={selectedMark === ANY} onClick={() => { setMobileSearch(""); setMobilePicker("model"); }} className="min-h-14 rounded-2xl border border-border bg-muted px-3 py-2 text-left active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
                <span className="block text-xs font-medium text-muted-foreground">{mobileModelLabel}</span>
                <span className="mt-1 block truncate text-sm font-bold text-foreground">{selectedModel === ANY ? tr("Choose model", "Pasirinkite modelį", "Выберите модель") : selectedModel}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground active:scale-[0.99]"
            >
              <AssetIcon name="filter" size={18} />
              {tr("Filters", "Filtrai", "Фильтры")}
              {extraFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-black">{extraFilterCount}</span>
              )}
            </button>
            <button type="button" onClick={showMobileListings} disabled={searching || countLoading} className="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#d9a339] px-4 text-sm font-extrabold text-black transition active:scale-[0.99] disabled:opacity-60">
              {searching
                ? tr("Searching…", "Ieškoma…", "Ищем…")
                : extraFilterCount > 0
                  ? mobileShowListingsLabel
                  : `${mobileShowListingsLabel} · ${countLoading ? "…" : mobileCountLabel}`}
            </button>
            {extraFilterCount === 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {countLoading ? tr("Updating count", "Atnaujinamas skaičius", "Обновляем количество") : tr("matching listings", "atitinkantys skelbimai", "подходящих объявлений")}
              </p>
            )}
          </div>

          {/* Desktop search panel */}
          <div className="hidden rounded-2xl bg-[#141517]/95 p-6 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md md:block lg:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2.5 border-b-2 border-accent pb-2 text-sm font-semibold text-white">
                <AssetIcon name="car" size={20} className="text-accent" />
                {tr("Passenger cars", "Lengvieji automobiliai", "Легковые автомобили")}
              </div>
              <button
                type="button"
                onClick={() => setMoreFiltersOpen((value) => !value)}
                aria-expanded={moreFiltersOpen}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/85 transition hover:text-accent"
              >
                <AssetIcon name="settings" size={18} />
                {moreFiltersOpen
                  ? tr("Hide advanced search", "Slėpti išplėstinę paiešką", "Скрыть расширенный поиск")
                  : tr("Advanced search", "Išplėstinė paieška", "Расширенный поиск")}
                {extraFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-black">{extraFilterCount}</span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
              <IconSelect
                icon="car"
                label={t("mark")}
                value={selectedMark}
                options={markSelectOptions}
                onChange={setSelectedMark}
              />
              <IconSelect
                icon="car-side"
                label={t("model")}
                value={selectedModel}
                options={modelSelectOptions}
                onChange={setSelectedModel}
                disabled={selectedMark === ANY}
              />
              <IconSelect
                icon="calendar"
                label={yearLabel}
                value={selectedRegistration}
                options={registrationOptions}
                onChange={setSelectedRegistration}
              />
              <IconSelect
                icon="gauge"
                label={t("mileage")}
                value={selectedMileage}
                options={mileageOptions}
                onChange={setSelectedMileage}
              />
              <button
                type="button"
                onClick={async () => {
                  await applyFilters();
                  scrollToResults();
                }}
                disabled={searching}
                className="col-span-2 flex h-16 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-accent px-7 text-base font-bold text-black transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 lg:col-span-1"
              >
                <AssetIcon name={searching ? "spinner" : "search"} size={20} className={searching ? "animate-spin" : ""} />
                {tr("Find listings", "Rasti skelbimus", "Найти объявления")}
              </button>
            </div>

            <div className="mt-5 flex items-center gap-6">
              <span className="shrink-0 text-sm font-semibold text-white">{t("priceRange")}</span>
              <PriceRangeSlider
                key={`price-${resetToken}`}
                className="max-w-[640px]"
                variant="dark"
                minPrice={DEFAULTS.priceMin}
                maxPrice={DEFAULTS.priceMax}
                step={100}
                label=""
                minLabel={t("min")}
                maxLabel={t("max")}
                onRangeChange={(min, max) => {
                  setPriceMin(min);
                  setPriceMax(max);
                }}
              />
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/85 transition hover:text-accent"
              >
                <AssetIcon name="reset" size={16} />
                {t("reset")}
              </button>
            </div>

            <div
              className={`grid transition-all duration-300 ease-out ${
                moreFiltersOpen ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid gap-x-10 gap-y-6 border-t border-white/10 pt-6 lg:grid-cols-3">
                  <div className="space-y-6">
                    <AdvancedChoice dark label={tr("Transmission", "Pavarų dėžė", "Коробка передач")} value={transmission} onChange={setTransmission} options={transmissionOptions} />
                    <AdvancedChoice dark label={tr("Number of doors", "Durų skaičius", "Количество дверей")} value={doors} onChange={setDoors} options={doorOptions} />
                  </div>
                  <div className="space-y-6">
                    <AdvancedChoice dark label={tr("Fuel type", "Kuro tipas", "Тип топлива")} value={fuel} onChange={setFuel} options={fuelOptions} />
                    <AdvancedChoice dark label={tr("Body type", "Kėbulo tipas", "Тип кузова")} value={category} onChange={setCategory} options={bodyOptions} />
                  </div>
                  <div className="space-y-3">
                    <IconSelect icon="bolt" label={tr("Minimum power", "Minimali galia", "Минимальная мощность")} value={String(powerMin)} options={powerOptions} onChange={(value) => setPowerMin(Number(value))} />
                    <IconSelect icon="sort" label={tr("Sort", "Rūšiavimas", "Сортировка")} value={sort} options={sortOptions} onChange={setSort} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {mobilePicker && createPortal(
            <div className="fixed inset-0 z-[100] bg-black/60 md:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobilePicker(null); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="mobile-picker-title" className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-3">
                  <div className="mx-auto mr-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
                  <div className="flex-1 text-center">
                    <h2 id="mobile-picker-title" className="text-lg font-extrabold text-foreground">{mobilePicker === "mark" ? mobileMakeLabel : mobileModelLabel}</h2>
                    {mobilePicker === "model" && <p className="mt-0.5 text-xs text-muted-foreground">{selectedMark}</p>}
                  </div>
                  <button type="button" onClick={() => setMobilePicker(null)} aria-label={tr("Close", "Uždaryti", "Закрыть")} className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"><AssetIcon name="close" size={20} /></button>
                </div>
                <div className="px-4 pt-4">
                  <input value={mobileSearch} onChange={(event) => setMobileSearch(event.target.value)} placeholder={tr("Search", "Ieškoti", "Поиск")} className="h-12 w-full rounded-2xl border border-border bg-muted px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-[#d9a339]" />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-2">
                  {mobilePicker === "model" && (
                    <button type="button" onClick={() => { setSelectedModel(ANY); setMobileSearch(""); }} className={`mb-1 flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold ${selectedModel === ANY ? "bg-[#d9a339]/15 text-foreground" : "text-foreground"}`}>
                      <span>{tr("All models", "Visi modeliai", "Все модели")}</span>{selectedModel === ANY && <AssetIcon name="check" size={18} className="text-[#b27b00]" />}
                    </button>
                  )}
                  {filteredPickerOptions.length ? filteredPickerOptions.map((name) => {
                    const selected = mobilePicker === "mark" ? selectedMark === name : selectedModel === name;
                    return <button key={name} type="button" onClick={() => {
                      if (mobilePicker === "mark") {
                        setSelectedMark(name);
                        setSelectedModel(ANY);
                        setMobileSearch("");
                        setMobilePicker("model");
                      } else {
                        setSelectedModel(name);
                        setMobileSearch("");
                      }
                    }} className={`flex min-h-12 w-full items-center justify-between border-b border-border/70 px-3 text-left text-sm font-semibold text-foreground ${selected ? "text-[#a56d00]" : ""}`}>
                      <span>{name}</span>{selected && <AssetIcon name="check" size={18} className="text-[#b27b00]" />}
                    </button>;
                  }) : <p className="px-3 py-8 text-center text-sm text-muted-foreground">{mobilePicker === "model" && modelsLoading ? tr("Loading models…", "Įkeliami modeliai…", "Загружаем модели…") : tr("Nothing found", "Nieko nerasta", "Ничего не найдено")}</p>}
                </div>
                <div className="border-t border-border bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                  <button type="button" onClick={showMobileListings} disabled={searching || countLoading || (mobilePicker === "mark" && selectedMark === ANY)} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#d9a339] px-4 text-sm font-extrabold text-black disabled:opacity-50">
                    {mobilePicker === "mark" ? tr("Choose a make to continue", "Pasirinkite markę", "Выберите марку") : `${mobileShowListingsLabel} · ${countLoading ? "…" : mobileCountLabel}`}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )}
          {mobileFiltersOpen && createPortal(
            <div className="fixed inset-0 z-[100] bg-black/60 md:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileFiltersOpen(false); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-4">
                  <h2 id="mobile-filters-title" className="text-lg font-extrabold text-foreground">{tr("Filters", "Filtrai", "Фильтры")}</h2>
                  <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label={tr("Close", "Uždaryti", "Закрыть")} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"><AssetIcon name="close" size={20} /></button>
                </div>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-foreground">{yearLabel}</span>
                      <select value={selectedRegistration} onChange={(e) => setSelectedRegistration(e.target.value)} className={mobileSelectClass}>
                        {registrationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-foreground">{t("mileage")}</span>
                      <select value={selectedMileage} onChange={(e) => setSelectedMileage(e.target.value)} className={mobileSelectClass}>
                        {mileageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <PriceRangeSlider
                    key={`price-mobile-${resetToken}`}
                    minPrice={DEFAULTS.priceMin}
                    maxPrice={DEFAULTS.priceMax}
                    step={100}
                    label={t("priceRange")}
                    minLabel={t("min")}
                    maxLabel={t("max")}
                    onRangeChange={(min, max) => {
                      setPriceMin(min);
                      setPriceMax(max);
                    }}
                  />
                  <AdvancedChoice label={tr("Transmission", "Pavarų dėžė", "Коробка передач")} value={transmission} onChange={setTransmission} options={transmissionOptions} />
                  <AdvancedChoice label={tr("Fuel type", "Kuro tipas", "Тип топлива")} value={fuel} onChange={setFuel} options={fuelOptions} />
                  <AdvancedChoice label={tr("Body type", "Kėbulo tipas", "Тип кузова")} value={category} onChange={setCategory} options={bodyOptions} />
                  <AdvancedChoice label={tr("Number of doors", "Durų skaičius", "Количество дверей")} value={doors} onChange={setDoors} options={doorOptions} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-foreground">{tr("Power", "Galia", "Мощность")}</span>
                      <select value={String(powerMin)} onChange={(e) => setPowerMin(Number(e.target.value))} className={mobileSelectClass}>
                        {powerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-foreground">{tr("Sort", "Rūšiavimas", "Сортировка")}</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value)} className={mobileSelectClass}>
                        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-border bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                  <button type="button" onClick={handleReset} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-bold text-foreground">
                    <AssetIcon name="reset" size={16} />
                    {t("reset")}
                  </button>
                  <button type="button" onClick={showMobileListings} disabled={searching} className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-[#d9a339] px-4 text-sm font-extrabold text-black disabled:opacity-50">
                    {searching ? tr("Searching…", "Ieškoma…", "Ищем…") : mobileShowListingsLabel}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )}
        </div>

        <div id="listings-results" className="scroll-mt-24 pt-10 md:pt-16">
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
                {searched
                  ? tr("Search results", "Paieškos rezultatai", "Результаты поиска")
                  : tr("Popular listings", "Populiarūs skelbimai", "Популярные объявления")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                {searched
                  ? tr("Listings matching your filters", "Skelbimai pagal jūsų filtrus", "Объявления по вашим фильтрам")
                  : tr("Current offers from verified sellers", "Aktualūs pasiūlymai iš patikrintų pardavėjų", "Актуальные предложения от проверенных продавцов")}
              </p>
            </div>
            <Link
              href="/search"
              className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent sm:inline-flex"
            >
              {tr("View all", "Žiūrėti visus", "Смотреть все")}
              <AssetIcon name="arrow-right" size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={t("noListings")}
              subtitle={t("noListingsSubtitle")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <CarCard
                  key={item.id}
                  id={item.id}
                  title={[item.mark, item.model].filter(Boolean).join(" ") || item.title}
                  price={item.price}
                  imageUrl={resolveListingImage(item.thumbnail)}
                  year={item.year}
                  mileage={item.mileage}
                  volume={item.volume}
                  fuel={item.fuel}
                  favorite={favoriteIds.has(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </div>
          )}

          {hasMore && !loading && items.length > 0 && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="md" className="rounded-full px-8" onClick={loadMore} loading={fetchingMore}>
                {t("more")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AdvancedChoice({
  label,
  value,
  onChange,
  options,
  dark = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  dark?: boolean;
}) {
  return (
    <div>
      <div className={`mb-2.5 text-sm font-semibold ${dark ? "text-white" : "font-bold text-foreground"}`}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => {
          const active = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "ANY" : optionValue)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? "border-accent bg-accent text-black"
                  : dark
                    ? "border-white/10 bg-white/[0.06] text-white/85 hover:border-accent"
                    : "border-border bg-muted text-foreground hover:border-accent"
              }`}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
