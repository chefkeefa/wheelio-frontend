/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { anybody } from "@/lib/fonts";
import FilterDropdown from "@/components/FilterDropdown";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import CarCard from "@/components/CarCard";
import Button from "@/components/Button";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import { FilterIcon, ResetIcon } from "@/components/icons";
import { getPublicListings } from "@/lib/listings";
import type { Listing, ListingsQuery } from "@/lib/listings";
import { useLanguage } from "@/context/LanguageContext";
import { BACKEND_ORIGIN } from "@/lib/config";

const ANY = "__ANY__";

const DEFAULTS = {
  mark: ANY,
  model: ANY,
  reg: ANY,
  mileage: ANY,
  priceMin: 0,
  priceMax: 100_000,
};

const PAGE_SIZE = 9;
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
  const { t, language } = useLanguage();
  const anyLabel = t("any");
  const tr = (en: string, lt: string, ru: string) =>
    language === "LT" ? lt : language === "RU" ? ru : en;

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

  const registrationOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [anyLabel, ...Array.from({ length: currentYear - 1979 }, (_, i) => String(currentYear - i))];
  }, [anyLabel]);

  const mileageOptions = useMemo(
    () => [
      anyLabel,
      "50,000 km",
      "100,000 km",
      "150,000 km",
    ],
    [anyLabel]
  );

  const visibleMarkValue =
    selectedMark === ANY ? anyLabel : selectedMark;

  const visibleModelValue =
    selectedModel === ANY ? anyLabel : selectedModel;

  const visibleRegistrationValue =
    selectedRegistration === ANY ? anyLabel : selectedRegistration;

  const visibleMileageValue =
    selectedMileage === ANY ? anyLabel : selectedMileage;

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
      return;
    }

    const markKey = markIdByName[selectedMark] || selectedMark.trim();

    if (!markKey) {
      setModelOptions([]);
      return;
    }

    let cancelled = false;

    const loadModels = async () => {
      try {
        const response = await fetch(
          `${CAR_API}/${encodeURIComponent(markKey)}`,
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
      } catch (error) {
        console.error("Error loading models:", error);

        if (!cancelled) {
          setModelOptions([]);
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

  const applyFilters = async () => {
    setSearching(true);
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
    setModelOptions([]);
    setDoors("ANY");
    setTransmission("ANY");
    setCategory("ANY");
    setFuel("ANY");
    setPowerMin(0);
    setSort("newest");
    setMoreFiltersOpen(false);
    setPriceMin(DEFAULTS.priceMin);
    setPriceMax(DEFAULTS.priceMax);
    setResetToken((value) => value + 1);
  };

  // Results are rendered exactly as returned by the backend after the user
  // presses “Find listings”. No mock cards and no hidden client-side reordering.
  const mainListings = items.slice(0, 9);
  const latestListings = items.slice(-4);

  return (
    <div className="pb-12 sm:pb-16">
      {/* Hero: deliberately restrained — one image, one message, one accent. */}
      <section className="relative overflow-hidden bg-[#0b0b0c] sm:rounded-b-[28px]">
        <div className="relative h-[430px] sm:h-[500px] lg:h-[560px]">
          <img
            src="/images/home-hero.jpg"
            alt="Yellow sports car on a road"
            className="absolute inset-0 h-full w-full object-cover object-[64%_center] sm:object-center"
            loading="eager"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent sm:from-black/85 sm:via-black/35" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />

          <div className="container relative z-[1] flex h-full items-center">
            <div className="max-w-[620px] pb-20 sm:pb-24">
              <div className="mb-4 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/75 sm:flex">
                <span className="h-px w-8 bg-white/70" />
                {tr("Cars, simply", "Automobiliai paprastai", "Автомобили — просто")}
              </div>
              <h1 className={`${anybody.className} max-w-[590px] text-[42px] font-extrabold leading-[0.98] tracking-[-0.035em] text-white sm:text-[58px] lg:text-[68px]`}>
                {tr("Buy or sell a car", "Pirk arba parduok automobilį", "Купи или продай автомобиль")}{" "}
                <span className="text-[#f4b92f]">{tr("easily", "lengvai", "легко")}</span>
              </h1>
              <p className="mt-5 max-w-[460px] text-sm leading-6 text-white/72 sm:text-base">
                {tr(
                  "A simple marketplace for buying and selling cars in Lithuania.",
                  "Paprasta vieta pirkti ir parduoti automobilius Lietuvoje.",
                  "Простой сервис для покупки и продажи автомобилей в Литве."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container relative z-10 -mt-20 sm:-mt-24 lg:-mt-[108px]">
        <div className="rounded-[24px] border border-white/10 bg-[#1b1b1d] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.28)] sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterDropdown
              label={t("mark")}
              value={visibleMarkValue}
              onChange={(value) => setSelectedMark(value === anyLabel ? ANY : value)}
              options={[anyLabel, ...markOptions]}
              allowCustom
            />
            <FilterDropdown
              label={t("model")}
              value={visibleModelValue}
              onChange={(value) => setSelectedModel(value === anyLabel ? ANY : value)}
              options={[anyLabel, ...modelOptions]}
              allowCustom
            />
            <FilterDropdown
              label={t("registration")}
              value={visibleRegistrationValue}
              onChange={(value) => setSelectedRegistration(value === anyLabel ? ANY : value)}
              options={registrationOptions}
            />
            <FilterDropdown
              label={t("mileage")}
              value={visibleMileageValue}
              onChange={(value) => setSelectedMileage(value === anyLabel ? ANY : value)}
              options={mileageOptions}
            />
            <div className="flex items-end">
              <Button variant="primary" size="md" className="h-11 w-full" onClick={applyFilters} loading={searching}>
                {t("searchOffers")}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 items-end gap-4 border-t border-white/10 pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
            <PriceRangeSlider
              key={`price-${resetToken}`}
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" icon={<FilterIcon />} iconPosition="left" onClick={() => setMoreFiltersOpen((value) => !value)}>
                {moreFiltersOpen ? tr("Hide filters", "Slėpti filtrus", "Скрыть фильтры") : t("moreFilters")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} icon={<ResetIcon />} iconPosition="left">
                {t("reset")}
              </Button>
            </div>
          </div>

          <div className={`grid overflow-hidden transition-all duration-300 ease-out ${moreFiltersOpen ? "mt-5 max-h-[1400px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.035] p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterDropdown label={t("mark")} value={visibleMarkValue} onChange={(value) => setSelectedMark(value === anyLabel ? ANY : value)} options={[anyLabel, ...markOptions]} allowCustom />
                  <FilterDropdown label={t("model")} value={visibleModelValue} onChange={(value) => setSelectedModel(value === anyLabel ? ANY : value)} options={[anyLabel, ...modelOptions]} allowCustom />
                  <FilterDropdown label={t("registration")} value={visibleRegistrationValue} onChange={(value) => setSelectedRegistration(value === anyLabel ? ANY : value)} options={registrationOptions} />
                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground">{tr("Sort", "Rūšiavimas", "Сортировка")}</label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm font-semibold text-foreground outline-none focus:border-accent">
                      <option value="newest">{tr("Newest first", "Naujausi pirmiausia", "Сначала новые")}</option>
                      <option value="price_asc">{tr("Price: low to high", "Kaina: nuo mažiausios", "Цена: по возрастанию")}</option>
                      <option value="price_desc">{tr("Price: high to low", "Kaina: nuo didžiausios", "Цена: по убыванию")}</option>
                      <option value="oldest">{tr("Oldest first", "Seniausi pirmiausia", "Сначала старые")}</option>
                      <option value="mileage_asc">{tr("Mileage: low to high", "Rida: nuo mažiausios", "Пробег: по возрастанию")}</option>
                      <option value="mileage_desc">{tr("Mileage: high to low", "Rida: nuo didžiausios", "Пробег: по убыванию")}</option>
                      <option value="year_desc">{tr("Year: newest first", "Metai: naujausi pirmiausia", "Год: сначала новые")}</option>
                      <option value="year_asc">{tr("Year: oldest first", "Metai: seniausi pirmiausia", "Год: сначала старые")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.035] p-4 sm:p-5">
                <AdvancedChoice label={tr("Number of doors", "Durų skaičius", "Количество дверей")} value={doors} onChange={setDoors} options={[["2_3", "2/3"], ["4_5", "4/5"]]} />
                <AdvancedChoice label={tr("Transmission", "Pavarų dėžė", "Коробка передач")} value={transmission} onChange={setTransmission} options={[["AUTO", tr("Automatic", "Automatinė", "Автомат")], ["MANUAL", tr("Manual", "Mechaninė", "Механика")]]} />
                <AdvancedChoice label={tr("Category", "Kategorija", "Категория")} value={category} onChange={setCategory} options={[["coupe", tr("Sports / coupe", "Sportinis / kupė", "Спорт / купе")], ["small", tr("Small car", "Mažas automobilis", "Малый автомобиль")], ["estate", tr("Estate", "Universalas", "Универсал")], ["saloon", tr("Saloon", "Sedanas", "Седан")], ["suv", "SUV"], ["hatchback", tr("Hatchback", "Hečbekas", "Хэтчбек")], ["cabriolet", tr("Cabriolet", "Kabrioletas", "Кабриолет")]]} />
                <AdvancedChoice label={tr("Fuel type", "Kuro tipas", "Тип топлива")} value={fuel} onChange={setFuel} options={[["PETROL", tr("Petrol", "Benzinas", "Бензин")], ["DIESEL", tr("Diesel", "Dyzelinas", "Дизель")], ["GAS", tr("Gas", "Dujos", "Газ")], ["ELECTRO", tr("Electric", "Elektra", "Электро")]]} />
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-foreground">{tr("Minimum power", "Minimali galia", "Минимальная мощность")}</label>
                  <select value={powerMin} onChange={(e) => setPowerMin(Number(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm font-semibold text-foreground outline-none focus:border-accent sm:max-w-[210px]">
                    <option value={0}>{tr("Any power", "Bet kokia galia", "Любая мощность")}</option>
                    <option value={75}>75 kW+</option><option value={100}>100 kW+</option><option value={150}>150 kW+</option><option value={200}>200 kW+</option><option value={300}>300 kW+</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => setMoreFiltersOpen(false)}>{tr("Close", "Uždaryti", "Закрыть")}</Button>
              <Button variant="primary" onClick={async () => { await applyFilters(); setMoreFiltersOpen(false); }} loading={searching}>{tr("Apply filters", "Taikyti filtrus", "Применить фильтры")}</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-10 sm:mt-14">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <h2 className={`${anybody.className} text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl`}>
              {tr("Popular listings", "Populiarūs skelbimai", "Популярные объявления")}
            </h2>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              {tr("Fresh offers from Wheelio sellers", "Naujausi Wheelio pardavėjų pasiūlymai", "Свежие предложения продавцов Wheelio")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : mainListings.length === 0 ? (
          <EmptyState title={t("noListings")} subtitle={t("noListingsSubtitle")} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mainListings.map((item) => (
              <CarCard key={item.id} id={item.id} title={item.title} price={item.price} imageUrl={resolveListingImage(item.thumbnail)} size="large" />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {hasMore && <Button variant="primary" size="lg" onClick={loadMore} loading={fetchingMore}>{t("more")}</Button>}
        </div>
      </section>

      {latestListings.length > 0 && (
        <section className="container mt-14 border-t border-border pt-10 sm:mt-20 sm:pt-14">
          <h2 className={`${anybody.className} mb-6 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl`}>
            {t("latestListings")}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latestListings.map((item) => (
              <CarCard key={`latest-${item.id}`} id={item.id} title={item.title} price={item.price} imageUrl={resolveListingImage(item.thumbnail)} size="small" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


function AdvancedChoice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 text-sm font-bold text-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => {
          const active = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(active ? "ANY" : optionValue)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[#d9a339] bg-[#d9a339] text-black"
                  : "border-border bg-muted text-foreground hover:border-[#d9a339]"
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
