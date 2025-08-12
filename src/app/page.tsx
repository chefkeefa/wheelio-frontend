// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Anybody } from "next/font/google";
import FilterDropdown from "../components/FilterDropdown";
import PriceRangeSlider from "../components/PriceRangeSlider";
import CarCard from "../components/CarCard";

const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  weight: ["800"], // extrabold
  display: "swap",
});

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
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
}));

export default function HomePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Фильтры (UI)
  const [selectedMark, setSelectedMark] = useState(DEFAULTS.mark);
  const [selectedModel, setSelectedModel] = useState(DEFAULTS.model);
  const [selectedRegistration, setSelectedRegistration] = useState(DEFAULTS.reg);
  const [selectedMileage, setSelectedMileage] = useState(DEFAULTS.mileage);

  // Цена — используется в фильтрации
  const [priceMin, setPriceMin] = useState<number>(DEFAULTS.priceMin);
  const [priceMax, setPriceMax] = useState<number>(DEFAULTS.priceMax);

  // Токен для жёсткого сброса слайдера
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(API, { cache: "no-store" });
        const raw = await res.json().catch(() => []);
        const arr = Array.isArray(raw) ? raw : [];

        // Нормализация без any
        const normalized: Listing[] = arr.map((x: Partial<Listing> | null, i: number) => ({
          id: String(x?.id ?? i + 1),
          title: String(x?.title ?? "Text text text"),
          price: Number(x?.price ?? 0),
          mileage: Number(x?.mileage ?? 0),
          thumbnail:
            typeof x?.thumbnail === "string" && x.thumbnail.length > 0
              ? x.thumbnail
              : undefined,
        }));

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

  const handleReset = () => {
    setSelectedMark(DEFAULTS.mark);
    setSelectedModel(DEFAULTS.model);
    setSelectedRegistration(DEFAULTS.reg);
    setSelectedMileage(DEFAULTS.mileage);
    setPriceMin(DEFAULTS.priceMin);
    setPriceMax(DEFAULTS.priceMax);
    setResetToken((t) => t + 1);
  };

  // Источник данных
  const base = items.length > 0 ? items : mockListings;

  // Фильтрация по цене (max может быть Infinity из слайдера)
  const filtered = useMemo(() => {
    const maxOk = Number.isFinite(priceMax) ? (v: number) => v <= priceMax : (_: number) => true;
    return base.filter((it) => it.price >= priceMin && maxOk(it.price));
  }, [base, priceMin, priceMax]);

  const mainListings = filtered.slice(0, 9);
  const latestListings = filtered.slice(9, 13);

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
          {/* Заголовок: Anybody, 48px, extrabold, переносы строк */}
          <div className="absolute left-6 top-6 md:left-12 md:top-10">
            <h1 className={`${anybody.className} text-[48px] font-extrabold leading-tight text-white`}>
              <span className="block">buy and</span>
              <span className="block">sell a car</span>
              <span className="block">easily!</span>
            </h1>
          </div>
        </div>
      </section>

      {/* SEARCH FILTERS — заезжает на картинку ~ на треть */}
      <section className="container">
        <div
          className="
            relative z-10
            -translate-y-[120px] sm:-translate-y-[160px] md:-translate-y-[200px] lg:-translate-y-[220px] xl:-translate-y-[240px]
          "
        >
          <div className="rounded-[40px] bg-[hsl(var(--muted))] p-6 md:p-8 shadow-card">
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
                options={["Any", "2020", "2019", "2018", "2017"]}
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
                  setPriceMax(max);
                }}
              />

              {/* Правый столбец с кнопкой и ссылками */}
              <div className="space-y-4">
                <button className="flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#5f5f5f] font-semibold text-white transition-colors hover:bg-gray-700">
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a6cc5711-7646-4ec4-95d8-560f208b9c7c"
                    alt="Search"
                    className="h-6 w-6"
                  />
                  Search offers
                </button>

                <div className="flex w-full justify-end gap-4">
                  <button className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[hsl(var(--accent))]">
                    <img
                      src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d30efceb-1604-46a0-82a1-fe94b17e79da"
                      alt="Filter"
                      className="h-3.5 w-3.5"
                    />
                    More filters
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 text-sm font-semibold text-black transition-colors hover:text-[hsl(var(--accent))]"
                  >
                    <img
                      src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5245294e-9c33-44e9-a16e-1cc84c6da426"
                      alt="Reset"
                      className="h-3.5 w-3.5"
                    />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Заполнитель, чтобы нижние секции не «подскакивали» при визуальном сдвиге */}
          <div className="h-[0px] sm:h-[40px] md:h-[60px] lg:h-[80px]" />
        </div>
      </section>

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
