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
import type { Listing } from "@/lib/listings";

const DEFAULTS = {
  mark: "Any",
  model: "Any",
  reg: "Any",
  mileage: "Any",
  priceMin: 0,
  priceMax: 100_000,
};

const PAGE_SIZE = 9;

const mockListings: Listing[] = Array.from({ length: 12 }, (_, i) => ({
  id: (i + 1).toString(),
  title: "Text text text",
  price: Math.floor(Math.random() * 50_000) + 10_000,
  mileage: Math.floor(Math.random() * 200_000) + 50_000,
  thumbnail:
    "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a0c5a0be-a3e7-4709-a493-1a91e67541ee",
}));

export default function HomePage() {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getPublicListings({ limit: PAGE_SIZE, offset: 0 });
        if (cancelled) return;
        const list = data.length ? data : mockListings;
        setItems(list);
        setHasMore(data.length >= PAGE_SIZE);
        setOffset(data.length);
      } catch {
        if (!cancelled) {
          setItems(mockListings);
          setHasMore(false);
          setOffset(mockListings.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyFilters = async () => {
    setSearching(true);
    try {
      const params = {
        mark: selectedMark !== "Any" ? selectedMark : undefined,
        model: selectedModel !== "Any" ? selectedModel : undefined,
        reg: selectedRegistration !== "Any" ? selectedRegistration : undefined,
        mileage: selectedMileage !== "Any" ? selectedMileage : undefined,
        priceMin,
        priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
        limit: PAGE_SIZE,
        offset: 0,
      } as const;

      const data = await getPublicListings(params);
      setItems(data);
      setHasMore(data.length >= PAGE_SIZE);
      setOffset(data.length);
    } catch {
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
      const params = {
        mark: selectedMark !== "Any" ? selectedMark : undefined,
        model: selectedModel !== "Any" ? selectedModel : undefined,
        reg: selectedRegistration !== "Any" ? selectedRegistration : undefined,
        mileage: selectedMileage !== "Any" ? selectedMileage : undefined,
        priceMin,
        priceMax: Number.isFinite(priceMax) ? priceMax : undefined,
        limit: PAGE_SIZE,
        offset,
      } as const;

      const more = await getPublicListings(params);
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
    setSelectedMark(DEFAULTS.mark);
    setSelectedModel(DEFAULTS.model);
    setSelectedRegistration(DEFAULTS.reg);
    setSelectedMileage(DEFAULTS.mileage);
    setPriceMin(DEFAULTS.priceMin);
    setPriceMax(DEFAULTS.priceMax);
    setResetToken((t) => t + 1);
  };

  const filtered = useMemo(() => {
    const maxOk = Number.isFinite(priceMax) ? (v: number) => v <= priceMax : (_: number) => true;
    const base = items.length > 0 ? items : mockListings;
    return base.filter((it) => it.price >= priceMin && maxOk(it.price));
  }, [items, priceMin, priceMax]);

  const mainListings = filtered.slice(0, 9);
  // ВАЖНО: берём последние 4, чтобы точно было 4 карточки, если записей >= 4
  const latestListings = filtered.slice(-4);

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
          <div className="absolute left-6 top-6 md:left-12 md:top-10">
            <h1 className={`${anybody.className} text-[48px] font-extrabold leading-tight text-white`}>
              <span className="block">buy and</span>
              <span className="block">sell a car</span>
              <span className="block">easily!</span>
            </h1>
          </div>
        </div>
      </section>

      {/* FILTERS + MAIN LISTINGS */}
      <section className="container">
        <div className="relative z-10 -mt-[120px] sm:-mt-[160px] md:-mt-[200px] lg:-mt-[220px] xl:-mt-[240px] mb-6 md:mb-8">
          <div className="rounded-[40px] bg-[hsl(var(--muted))] p-6 md:p-8 ring-1 ring-[hsl(var(--border))]">
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
              <FilterDropdown label="Mark" value={selectedMark} onChange={setSelectedMark} options={["Any", "BMW", "Mercedes", "Audi", "Volkswagen"]} />
              <FilterDropdown label="Model" value={selectedModel} onChange={setSelectedModel} options={["Any", "3 Series", "C-Class", "A4", "Golf"]} />
              <FilterDropdown label="1st registration form" value={selectedRegistration} onChange={setSelectedRegistration} options={["Any", "2020", "2019", "2018", "2017"]} />
              <FilterDropdown label="Mileage up to" value={selectedMileage} onChange={(v) => setSelectedMileage(v)} options={["Any", "50,000 km", "100,000 km", "150,000 km"]} />
            </div>

            <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
              <PriceRangeSlider
                key={`price-${resetToken}`}
                minPrice={DEFAULTS.priceMin}
                maxPrice={DEFAULTS.priceMax}
                step={100}
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
                  Search offers
                </Button>

                <div className="flex w-full justify-end gap-4">
                  <Button variant="ghost" size="sm" icon={<FilterIcon />} iconPosition="left">
                    More filters
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset} icon={<ResetIcon />} iconPosition="left">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LISTINGS — верхние: lg = 3 колонки */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : mainListings.length === 0 ? (
          <EmptyState title="No listings found" subtitle="Try widening your filters or reset them." />
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
          {hasMore && (
            <Button variant="primary" size="lg" onClick={loadMore} loading={fetchingMore}>
              More
            </Button>
          )}
        </div>
      </section>

      {/* LATEST LISTINGS — здесь 4 в ряд */}
      <section className="container">
        <h2 className={`${anybody.className} mb-8 text-center text-4xl font-bold text-black md:text-6xl`}>
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
      </section>
    </div>
  );
}
