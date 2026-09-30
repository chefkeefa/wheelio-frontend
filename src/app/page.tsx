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

const FALLBACK_CAR_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#eeeeef"/>
      <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#b0b0b3">Wheelio</text>
      <text x="600" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#b0b0b3">No photo</text>
    </svg>
  `);

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

    const markId = markIdByName[selectedMark];

    if (!markId) {
      setModelOptions([]);
      return;
    }

    let cancelled = false;

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
    <div className="space-y-12">
      <section className="relative">
        <div className="relative h-[641px] overflow-hidden rounded-2xl">
          <img
            src="/images/hero-car.jpg"
            alt="Hero Car"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />

          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-black via-black/85 to-transparent" />

          <div className="absolute left-6 top-6 md:left-12 md:top-10">
            <h1
              className={`${anybody.className} text-[48px] font-extrabold leading-tight text-white`}
            >
              <span className="block">{t("heroLine1")}</span>
              <span className="block">{t("heroLine2")}</span>
              <span className="block">{t("heroLine3")}</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="relative z-10 -mt-[120px] mb-6 sm:-mt-[160px] md:-mt-[200px] md:mb-8 lg:-mt-[220px] xl:-mt-[240px]">
          <div className="rounded-[40px] bg-[hsl(var(--muted))] p-6 ring-1 ring-[hsl(var(--border))] md:p-8">
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
              <FilterDropdown
                label={t("mark")}
                value={visibleMarkValue}
                onChange={(value) =>
                  setSelectedMark(value === anyLabel ? ANY : value)
                }
                options={[anyLabel, ...markOptions]}
              />

              <FilterDropdown
                label={t("model")}
                value={visibleModelValue}
                onChange={(value) =>
                  setSelectedModel(value === anyLabel ? ANY : value)
                }
                options={[anyLabel, ...modelOptions]}
              />

              <FilterDropdown
                label={t("registration")}
                value={visibleRegistrationValue}
                onChange={(value) =>
                  setSelectedRegistration(value === anyLabel ? ANY : value)
                }
                options={registrationOptions}
              />

              <FilterDropdown
                label={t("mileage")}
                value={visibleMileageValue}
                onChange={(value) =>
                  setSelectedMileage(value === anyLabel ? ANY : value)
                }
                options={mileageOptions}
              />
            </div>

            <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
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

              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={applyFilters}
                  loading={searching}
                >
                  {t("searchOffers")}
                </Button>

                <div className="flex w-full justify-end gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FilterIcon />}
                    iconPosition="left"
                    onClick={() => setMoreFiltersOpen((value) => !value)}
                  >
                    {moreFiltersOpen
                      ? tr("Hide filters", "Slėpti filtrus", "Скрыть фильтры")
                      : t("moreFilters")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    icon={<ResetIcon />}
                    iconPosition="left"
                  >
                    {t("reset")}
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
                moreFiltersOpen
                  ? "mt-7 max-h-[1200px] translate-y-0 opacity-100"
                  : "max-h-0 -translate-y-2 opacity-0"
              }`}
            >
              <div className="grid gap-5 border-t border-border pt-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#d9a339]/70 bg-card p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FilterDropdown
                      label={t("mark")}
                      value={visibleMarkValue}
                      onChange={(value) =>
                        setSelectedMark(value === anyLabel ? ANY : value)
                      }
                      options={[anyLabel, ...markOptions]}
                    />
                    <FilterDropdown
                      label={t("model")}
                      value={visibleModelValue}
                      onChange={(value) =>
                        setSelectedModel(value === anyLabel ? ANY : value)
                      }
                      options={[anyLabel, ...modelOptions]}
                    />
                    <FilterDropdown
                      label={t("registration")}
                      value={visibleRegistrationValue}
                      onChange={(value) =>
                        setSelectedRegistration(value === anyLabel ? ANY : value)
                      }
                      options={registrationOptions}
                    />
                    <div>
                      <label className="mb-2 block text-sm font-bold text-foreground">
                        {tr("Sort", "Rūšiavimas", "Сортировка")}
                      </label>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm font-semibold text-foreground outline-none focus:border-accent"
                      >
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

                <div className="rounded-2xl border border-[#d9a339]/70 bg-card p-5">
                  <AdvancedChoice
                    label={tr("Number of doors", "Durų skaičius", "Количество дверей")}
                    value={doors}
                    onChange={setDoors}
                    options={[
                      ["2_3", "2/3"],
                      ["4_5", "4/5"],
                    ]}
                  />

                  <AdvancedChoice
                    label={tr("Transmission", "Pavarų dėžė", "Коробка передач")}
                    value={transmission}
                    onChange={setTransmission}
                    options={[
                      ["AUTO", tr("Automatic", "Automatinė", "Автомат")],
                      ["MANUAL", tr("Manual", "Mechaninė", "Механика")],
                    ]}
                  />

                  <AdvancedChoice
                    label={tr("Category", "Kategorija", "Категория")}
                    value={category}
                    onChange={setCategory}
                    options={[
                      ["coupe", tr("Sports / coupe", "Sportinis / kupė", "Спорт / купе")],
                      ["small", tr("Small car", "Mažas automobilis", "Малый автомобиль")],
                      ["estate", tr("Estate", "Universalas", "Универсал")],
                      ["saloon", tr("Saloon", "Sedanas", "Седан")],
                      ["suv", "SUV"],
                      ["hatchback", tr("Hatchback", "Hečbekas", "Хэтчбек")],
                      ["cabriolet", tr("Cabriolet", "Kabrioletas", "Кабриолет")],
                    ]}
                  />

                  <AdvancedChoice
                    label={tr("Fuel type", "Kuro tipas", "Тип топлива")}
                    value={fuel}
                    onChange={setFuel}
                    options={[
                      ["PETROL", tr("Petrol", "Benzinas", "Бензин")],
                      ["DIESEL", tr("Diesel", "Dyzelinas", "Дизель")],
                      ["GAS", tr("Gas", "Dujos", "Газ")],
                      ["ELECTRO", tr("Electric", "Elektra", "Электро")],
                    ]}
                  />

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-bold text-foreground">
                      {tr("Minimum power", "Minimali galia", "Минимальная мощность")}
                    </label>
                    <select
                      value={powerMin}
                      onChange={(e) => setPowerMin(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm font-semibold text-foreground outline-none focus:border-accent sm:max-w-[210px]"
                    >
                      <option value={0}>{tr("Any power", "Bet kokia galia", "Любая мощность")}</option>
                      <option value={75}>75 kW+</option>
                      <option value={100}>100 kW+</option>
                      <option value={150}>150 kW+</option>
                      <option value={200}>200 kW+</option>
                      <option value={300}>300 kW+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setMoreFiltersOpen(false)}>
                  {tr("Close", "Uždaryti", "Закрыть")}
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    await applyFilters();
                    setMoreFiltersOpen(false);
                  }}
                  loading={searching}
                >
                  {tr("Apply filters", "Taikyti filtrus", "Применить фильтры")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : mainListings.length === 0 ? (
          <EmptyState
            title={t("noListings")}
            subtitle={t("noListingsSubtitle")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mainListings.map((item) => (
              <CarCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                imageUrl={resolveListingImage(item.thumbnail)}
                size="large"
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {hasMore && (
            <Button
              variant="primary"
              size="lg"
              onClick={loadMore}
              loading={fetchingMore}
            >
              {t("more")}
            </Button>
          )}
        </div>
      </section>

      <section className="container">
        <h2
          className={`${anybody.className} mb-8 text-center text-4xl font-bold text-foreground md:text-6xl`}
        >
          {t("latestListings")}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {latestListings.map((item) => (
            <CarCard
              key={`latest-${item.id}`}
              id={item.id}
              title={item.title}
              price={item.price}
              imageUrl={resolveListingImage(item.thumbnail)}
              size="small"
            />
          ))}
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
