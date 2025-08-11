// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterDropdown from "../components/FilterDropdown";
import PriceRangeSlider from "../components/PriceRangeSlider";
import CarCard from "../components/CarCard";
import Icon from "@/components/ui/Icon";

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
  make?: string | null;
  model?: string | null;
  registrationYear?: number | null;
};

type ApiListing = {
  id?: string | number;
  title?: string;
  price?: number | string;
  mileage?: number | string;
  thumbnail?: string;
  make?: string;
  mark?: string;
  model?: string;
  registrationYear?: number | string | null;
  year?: number | string | null;
  firstRegistration?: { year?: number | string | null } | null;
};

const API = "https://pirkauto-backend.onrender.com/api/public/listings";

const DEFAULTS = {
  mark: "Any",
  model: "Any",
  reg: "Any",
  mileage: "Any",
  priceMin: 0,
  priceMax: 100_000,
};

// Fallback-данные, если бэкенд не ответил
const mockListings: Listing[] = Array.from({ length: 13 }, (_, i) => ({
  id: (i + 1).toString(),
  title: "Text text text",
  price: Math.floor(Math.random() * 50_000) + 10_000,
  mileage: Math.floor(Math.random() * 200_000) + 50_000,
  thumbnail: `https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/${
    [
      "a7700da0-47f9-4836-b1c3-61841773096d",
      "dd77542a-044f-44a9-93c3-ccc4d1c7c0fd",
      "8002e9b2-dce7-4377-8909-2846e985a3df",
      "6505abdc-78a9-45d7-9bcd-eec3f6e46d96",
      "6b7d3f77-aa06-43b0-82e6-edb9874639af",
      "ffe88bcc-acf5-4663-b232-055be9c95abe",
      "4041c68f-8504-4e42-914c-baebb3d0cede",
      "af39d605-bcaf-45f5-a867-84c8f4879a64",
      "de102b86-6205-4ee7-8c54-801a1b99f4fe",
    ][i % 9]
  }`,
  make: null,
  model: null,
  registrationYear: null,
}));

// Опции пробега -> числовой предел
const mileageCapFromOption = (opt: string): number | null => {
  if (opt === "Any") return null;
  const digits = opt.replace(/[^\d]/g, "");
  if (!digits) return null;
  return parseInt(digits, 10);
};

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI-состояние фильтров
  const [selectedMark, setSelectedMark] = useState(DEFAULTS.mark);
  const [selectedModel, setSelectedModel] = useState(DEFAULTS.model);
  const [selectedRegistration, setSelectedRegistration] = useState(DEFAULTS.reg);
  const [selectedMileage, setSelectedMileage] = useState(DEFAULTS.mileage);

  // Текущие значения цены (живут вместе со слайдером)
  const [priceMin, setPriceMin] = useState<number>(DEFAULTS.priceMin);
  const [priceMax, setPriceMax] = useState<number>(DEFAULTS.priceMax); // может быть Infinity

  // Применённые фильтры (фиксируются по кнопке "Search offers")
  const [applied, setApplied] = useState({
    mark: DEFAULTS.mark,
    model: DEFAULTS.model,
    reg: DEFAULTS.reg,
    mileage: DEFAULTS.mileage,
    priceMin: DEFAULTS.priceMin,
    priceMax: DEFAULTS.priceMax as number, // используем number; Infinity тоже number
  });

  // Флаг: пользователь нажал Search хотя бы раз
  const [hasSearched, setHasSearched] = useState(false);

  // Токен для полного сброса слайдера
  const [resetToken, setResetToken] = useState(0);

  // Инициализация из URL
  useEffect(() => {
    const m = searchParams.get("mark") ?? DEFAULTS.mark;
    const mo = searchParams.get("model") ?? DEFAULTS.model;
    const r = searchParams.get("reg") ?? DEFAULTS.reg;
    const ml = searchParams.get("mileage") ?? DEFAULTS.mileage;
    const pmin = parseInt(searchParams.get("pmin") ?? "", 10);
    const pmaxParam = searchParams.get("pmax");
    const pmax = pmaxParam === "inf" ? Infinity : parseInt(pmaxParam ?? "", 10);

    // Есть ли что в URL
    const anyQuery =
      (m && m !== DEFAULTS.mark) ||
      (mo && mo !== DEFAULTS.model) ||
      (r && r !== DEFAULTS.reg) ||
      (ml && ml !== DEFAULTS.mileage) ||
      Number.isFinite(pmin) ||
      typeof pmaxParam === "string";

    // Проставляем UI
    setSelectedMark(m);
    setSelectedModel(mo);
    setSelectedRegistration(r);
    setSelectedMileage(ml);

    if (Number.isFinite(pmin)) setPriceMin(pmin);
    if (typeof pmaxParam === "string")
      setPriceMax(Number.isNaN(pmax) ? DEFAULTS.priceMax : pmax);

    if (anyQuery) {
      setApplied({
        mark: m,
        model: mo,
        reg: r,
        mileage: ml,
        priceMin: Number.isFinite(pmin) ? pmin : DEFAULTS.priceMin,
        priceMax:
          pmaxParam === "inf"
            ? Infinity
            : Number.isFinite(pmax)
            ? pmax
            : DEFAULTS.priceMax,
      });
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // только при первом рендере

  // Загрузка данных
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(API, { cache: "no-store" });
        const raw = (await res.json().catch(() => [])) as unknown;
        const arr = Array.isArray(raw) ? (raw as ApiListing[]) : [];

        // Нормализация/обогащение
        const normalized: Listing[] = arr.map((x: ApiListing, i: number) => {
          const yearRaw =
            x.registrationYear ??
            x.year ??
            (typeof x.firstRegistration === "object" && x.firstRegistration
              ? x.firstRegistration.year
              : null);

          const asNumber = (v: unknown, fallback = 0) =>
            typeof v === "number" ? v : typeof v === "string" ? Number(v) : fallback;

          return {
            id: String(x.id ?? i + 1),
            title: String(x.title ?? "Text text text"),
            price: asNumber(x.price, 0),
            mileage: asNumber(x.mileage, 0),
            thumbnail:
              typeof x.thumbnail === "string" && x.thumbnail.length > 0
                ? x.thumbnail
                : undefined,
            make: x.make ?? x.mark ?? null,
            model: x.model ?? null,
            registrationYear:
              typeof yearRaw === "number"
                ? yearRaw
                : typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw)
                ? Number(yearRaw)
                : null,
          };
        });

        // Сортировка по id
        const sorted = [...normalized].sort((a, b) => {
          const na = Number(a.id);
          const nb = Number(b.id);
          if (!Number.isNaN(nb) && !Number.isNaN(na)) return nb - na;
          return b.id.localeCompare(a.id);
        });

        if (!cancelled) setItems(sorted.length ? sorted : mockListings);
      } catch {
        if (!cancelled) setItems(mockListings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // В URL кладём компактные значения, Infinity -> "inf"
  const pushToUrl = (s: {
    mark: string;
    model: string;
    reg: string;
    mileage: string;
    priceMin: number;
    priceMax: number; // может быть Infinity
  }) => {
    const params = new URLSearchParams();
    if (s.mark !== DEFAULTS.mark) params.set("mark", s.mark);
    if (s.model !== DEFAULTS.model) params.set("model", s.model);
    if (s.reg !== DEFAULTS.reg) params.set("reg", s.reg);
    if (s.mileage !== DEFAULTS.mileage) params.set("mileage", s.mileage);
    if (s.priceMin !== DEFAULTS.priceMin) params.set("pmin", String(s.priceMin));
    if (s.priceMax !== DEFAULTS.priceMax) {
      params.set("pmax", Number.isFinite(s.priceMax) ? String(s.priceMax) : "inf");
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  // Сабмит фильтров
  const handleSearch = () => {
    const next = {
      mark: selectedMark,
      model: selectedModel,
      reg: selectedRegistration,
      mileage: selectedMileage,
      priceMin,
      priceMax,
    };
    setApplied(next);
    pushToUrl(next);
    setHasSearched(true);
  };

  // Сброс всех фильтров
  const handleReset = () => {
    setSelectedMark(DEFAULTS.mark);
    setSelectedModel(DEFAULTS.model);
    setSelectedRegistration(DEFAULTS.reg);
    setSelectedMileage(DEFAULTS.mileage);
    setPriceMin(DEFAULTS.priceMin);
    setPriceMax(DEFAULTS.priceMax);
    const base = {
      mark: DEFAULTS.mark,
      model: DEFAULTS.model,
      reg: DEFAULTS.reg,
      mileage: DEFAULTS.mileage,
      priceMin: DEFAULTS.priceMin,
      priceMax: DEFAULTS.priceMax,
    };
    setApplied(base);
    setHasSearched(false);
    setResetToken((t) => t + 1);
    router.replace("/", { scroll: false });
  };

  // Фильтрация по "applied"
  const filtered = useMemo(() => {
    const cap = mileageCapFromOption(applied.mileage);

    return (items.length ? items : mockListings).filter((it) => {
      // Цена
      const priceOk =
        it.price >= applied.priceMin &&
        (Number.isFinite(applied.priceMax) ? it.price <= applied.priceMax : true);

      // Пробег
      const mileageOk = cap == null ? true : it.mileage <= cap;

      // Марка/модель — сначала пробуем поля, иначе ищем в title
      const titleLower = it.title.toLowerCase();
      const makeLower = (it.make ?? "").toLowerCase();
      const modelLower = (it.model ?? "").toLowerCase();

      const markOk =
        applied.mark === "Any"
          ? true
          : makeLower
          ? makeLower === applied.mark.toLowerCase()
          : titleLower.includes(applied.mark.toLowerCase());

      const modelOk =
        applied.model === "Any"
          ? true
          : modelLower
          ? modelLower === applied.model.toLowerCase()
          : titleLower.includes(applied.model.toLowerCase());

      // Год регистрации
      let year: number | null = it.registrationYear ?? null;
      if (year == null) {
        const m = it.title.match(/\b(19|20)\d{2}\b/);
        if (m) year = Number(m[0]);
      }
      const regOk =
        applied.reg === "Any"
          ? true
          : year != null
          ? String(year) === applied.reg
          : true;

      return priceOk && mileageOk && markOk && modelOk && regOk;
    });
  }, [items, applied]);

  const mainListings = filtered.slice(0, 9);
  const latestListings = filtered.slice(9, 13);

  // Чипсы активных фильтров (без цены)
  const chips = useMemo(() => {
    const res: Array<{ key: keyof typeof applied; label: string; value: string }> = [];
    if (applied.mark !== DEFAULTS.mark) res.push({ key: "mark", label: "Mark", value: applied.mark });
    if (applied.model !== DEFAULTS.model) res.push({ key: "model", label: "Model", value: applied.model });
    if (applied.reg !== DEFAULTS.reg) res.push({ key: "reg", label: "Year", value: applied.reg });
    if (applied.mileage !== DEFAULTS.mileage) res.push({ key: "mileage", label: "Mileage", value: applied.mileage });
    return res;
  }, [applied]);

  const removeChip = (key: keyof typeof applied) => {
    const next = { ...applied };
    if (key === "mark") next.mark = DEFAULTS.mark;
    if (key === "model") next.model = DEFAULTS.model;
    if (key === "reg") next.reg = DEFAULTS.reg;
    if (key === "mileage") next.mileage = DEFAULTS.mileage;

    setSelectedMark(next.mark);
    setSelectedModel(next.model);
    setSelectedRegistration(next.reg);
    setSelectedMileage(next.mileage);

    setApplied(next);
    pushToUrl(next);
  };

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[641px] overflow-hidden rounded-2xl">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a0c5a0be-a3e7-4709-a493-1a91e67541ee"
            alt="Hero Car"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/30" />
          {/* Заголовок: левый верх, как у Price/Model */}
          <div className="absolute left-6 top-6 md:left-16 md:top-8">
            <h1 className="text-base font-semibold text-white">
              buy and sell a car easily!
            </h1>
          </div>
        </div>
      </section>

      {/* SEARCH FILTERS — чуть перекрываем HERO */}
      <section className="container -mt-10 md:-mt-16">
        <div className="relative z-10 rounded-[40px] bg-[hsl(var(--muted))] p-6 md:p-8">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
            <FilterDropdown
              label="Mark"
              value={selectedMark}
              onChange={setSelectedMark}
              options={["Any", "BMW", "Mercedes", "Audi", "Volkswagen"]}
            />
            <FilterDropdown
              label="Model"
              value={selectedModel}
              onChange={setSelectedModel}
              options={["Any", "3 Series", "C-Class", "A4", "Golf"]}
            />
            <FilterDropdown
              label="1st registration form"
              value={selectedRegistration}
              onChange={setSelectedRegistration}
              options={["Any", "2023", "2022", "2021", "2020", "2019", "2018", "2017"]}
            />
            <FilterDropdown
              label="Mileage up to"
              value={selectedMileage}
              onChange={setSelectedMileage}
              options={["Any", "50,000 km", "100,000 km", "150,000 km"]}
            />
          </div>

          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
            {/* Слайдер цены */}
            <PriceRangeSlider
              key={`price-${resetToken}`}
              minPrice={DEFAULTS.priceMin}
              maxPrice={DEFAULTS.priceMax}
              step={1000}
              onRangeChange={(min, max) => {
                setPriceMin(min);
                setPriceMax(max); // Infinity допустимо
              }}
            />

            {/* Правый столбец с кнопкой и ссылками */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleSearch}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#5f5f5f] font-semibold text-white transition-colors hover:bg-gray-700"
              >
                <Icon name="search" size={24} />
                Search offers
              </button>

              <div className="flex w-full justify-end gap-4">
                <button className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[hsl(var(--accent))]">
                  <Icon name="filter" size={18} />
                  More filters
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[hsl(var(--accent))]"
                >
                  <Icon name="reset" size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ПЛАШКА: только количество, по центру */}
      {hasSearched && !loading && (
        <section className="container -mt-2">
          <div className="flex items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-card">
            <p className="text-center text-base font-semibold text-black">
              <span className="font-extrabold text-[hsl(var(--accent))]">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "offer" : "offers"} found
            </p>
          </div>
        </section>
      )}

      {/* ЧИПСЫ АКТИВНЫХ ФИЛЬТРОВ */}
      {hasSearched && ((applied.mark !== DEFAULTS.mark) || (applied.model !== DEFAULTS.model) || (applied.reg !== DEFAULTS.reg) || (applied.mileage !== DEFAULTS.mileage)) && (
        <section className="container -mt-6">
          <div className="flex flex-wrap gap-2">
            {applied.mark !== DEFAULTS.mark && (
              <button
                type="button"
                onClick={() => removeChip("mark")}
                className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))] bg-white px-3 py-1 text-sm font-semibold text-black shadow-sm hover:bg-[hsl(var(--muted))]"
                title="Remove filter"
              >
                <span className="opacity-70">Mark:</span>
                <span>{applied.mark}</span>
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white leading-none">×</span>
              </button>
            )}
            {applied.model !== DEFAULTS.model && (
              <button
                type="button"
                onClick={() => removeChip("model")}
                className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))] bg-white px-3 py-1 text-sm font-semibold text-black shadow-sm hover:bg-[hsl(var(--muted))]"
                title="Remove filter"
              >
                <span className="opacity-70">Model:</span>
                <span>{applied.model}</span>
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white leading-none">×</span>
              </button>
            )}
            {applied.reg !== DEFAULTS.reg && (
              <button
                type="button"
                onClick={() => removeChip("reg")}
                className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))] bg-white px-3 py-1 text-sm font-semibold text-black shadow-sm hover:bg-[hsl(var(--muted))]"
                title="Remove filter"
              >
                <span className="opacity-70">Year:</span>
                <span>{applied.reg}</span>
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white leading-none">×</span>
              </button>
            )}
            {applied.mileage !== DEFAULTS.mileage && (
              <button
                type="button"
                onClick={() => removeChip("mileage")}
                className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))] bg-white px-3 py-1 text-sm font-semibold text-black shadow-sm hover:bg-[hsl(var(--muted))]"
                title="Remove filter"
              >
                <span className="opacity-70">Mileage:</span>
                <span>{applied.mileage}</span>
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white leading-none">×</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* MAIN LISTINGS */}
      <section className="container">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mainListings.map((item) => (
              <CarCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                imageUrl={item.thumbnail || "/placeholder-car.jpg"}
                size="large"
              />
            ))}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <button className="rounded-lg bg-[#5f5f5f] px-12 py-3 text-xl font-extrabold text-white transition-colors hover:bg-gray-700">
            More
          </button>
        </div>
      </section>

      {/* LATEST LISTINGS */}
      <section className="container">
        <h2 className="mb-8 text-4xl font-extrabold text-black md:text-6xl">
          Latest listings
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {latestListings.map((item) => (
            <CarCard
              key={`latest-${item.id}`}
              id={item.id}
              title={item.title}
              price={item.price}
              imageUrl={item.thumbnail || "/placeholder-car.jpg"}
              size="small"
            />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button className="rounded-lg bg-[#5f5f5f] px-12 py-3 text-xl font-extrabold text-white transition-colors hover:bg-gray-700">
            More
          </button>
        </div>
      </section>
    </div>
  );
}
