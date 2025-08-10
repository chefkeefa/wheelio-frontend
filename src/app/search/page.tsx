// src/app/search/page.tsx
"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
};

const API = "https://pirkauto-backend.onrender.com/api/public/listings";

function SearchInner() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // поля фильтра
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const params = useSearchParams();
  const createdId = useMemo(() => params.get("created"), [params]);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Listing[]) =>
        setItems([...data].sort((a, b) => Number(b.id) - Number(a.id))) // новые сверху
      )
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
        <div className="space-y-3 rounded-lg border p-4 bg-white">
          <input
            type="text"
            placeholder="Markė / modelis"
            className="w-full rounded border px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Kaina nuo"
              className="w-1/2 rounded border px-3 py-2"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
            />
            <input
              type="number"
              placeholder="Kaina iki"
              className="w-1/2 rounded border px-3 py-2"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className="flex gap-3">
            <button
              className="w-full rounded-lg bg-black text-white py-2"
              onClick={clearFilters}
              type="button"
            >
              Išvalyti filtrus
            </button>
          </div>
        </div>
      </aside>

      {/* Результаты */}
      <div className="md:col-span-9 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rezultatai</h1>
          <span className="text-sm text-gray-500">
            {loading ? "Kraunama…" : `${filtered.length} pasiūlymai`}
          </span>
        </div>

        {/* Баннер после создания */}
        {createdId ? (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
            Skelbimas #{createdId} sėkmingai sukurtas.
          </div>
        ) : null}

        {loading ? (
          <div className="text-gray-500">Kraunama…</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">Nieko nerasta.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/listing/?id=${item.id}`}
                className="rounded-lg border bg-white p-4 hover:shadow"
              >
                <div className="aspect-video w-full rounded bg-gray-100 mb-3 overflow-hidden">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-gray-700">
                  {item.price.toLocaleString()} €
                </div>
                <div className="text-gray-500 text-sm">
                  Rida: {item.mileage.toLocaleString()} km
                </div>
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
    <Suspense fallback={<section className="rounded-lg border bg-white p-5">Kraunama…</section>}>
      <SearchInner />
    </Suspense>
  );
}
