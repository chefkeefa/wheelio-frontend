// src/app/search/page.tsx
"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicListings, type Listing as ApiListing } from "@/lib/listings";

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
};

function SearchInner() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // фильтры
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const params = useSearchParams();
  const createdId = useMemo(() => params.get("created"), [params]);

  useEffect(() => {
    getPublicListings({ limit: 100 })
      .then((data: ApiListing[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // применяем фильтры на клиенте
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : -Infinity;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    return items.filter((it) => {
      const byText = !q || it.title.toLowerCase().includes(q);
      const byMin = it.price >= min;
      const byMax = it.price <= max;
      return byText && byMin && byMax;
    });
  }, [items, query, minPrice, maxPrice]);

  const clearFilters = () => {
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Фильтры */}
      <aside className="md:col-span-3 space-y-4">
        <h2 className="text-lg font-semibold">Filtrai</h2>
        <div className="card p-4 space-y-3">
          <input
            type="text"
            placeholder="Markė / modelis"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Kaina nuo"
              className="input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
            />
            <input
              type="number"
              placeholder="Kaina iki"
              className="input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className="flex gap-3">
            <button className="btn-outline flex-1" type="button" onClick={clearFilters}>
              Išvalyti filtrus
            </button>
          </div>
        </div>
      </aside>

      {/* Результаты */}
      <div className="md:col-span-9 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Rezultatai</h1>
          <span className="text-sm text-[hsl(var(--muted-fg))]">
            {loading ? "Kraunama…" : `${filtered.length} pasiūlymai`}
          </span>
        </div>

        {/* Баннер после создания */}
        {createdId ? (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">
            Skelbimas #{createdId} sėkmingai sukurtas.
          </div>
        ) : null}

        {loading ? (
          <div className="text-[hsl(var(--muted-fg))]">Kraunama…</div>
        ) : filtered.length === 0 ? (
          <div className="text-[hsl(var(--muted-fg))]">Nieko nerasta.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`} className="block">
                <article className="card overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Картинка */}
                  <div className="relative aspect-video bg-[hsl(var(--muted))]">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  {/* Контент карточки */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <div className="shrink-0 text-right text-xl font-semibold">
                        {item.price.toLocaleString()} €
                      </div>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-fg))]">
                      Rida: {item.mileage.toLocaleString()} km
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<section className="card p-5">Kraunama…</section>}>
      <SearchInner />
    </Suspense>
  );
}
