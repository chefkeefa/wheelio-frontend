// src/app/search/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Listing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  thumbnail?: string;
};

export default function SearchPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем статический JSON из public/
    fetch("https://pirkauto-backend.onrender.com/api/public/listings")
      .then((r) => r.json())
      .then((data: Listing[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Фильтры (заглушка) */}
      <aside className="md:col-span-3 space-y-4">
        <h2 className="text-lg font-semibold">Filtrai</h2>
        <div className="space-y-3 rounded-lg border p-4 bg-white">
          <input type="text" placeholder="Markė / modelis" className="w-full rounded border px-3 py-2" />
          <div className="flex gap-3">
            <input type="number" placeholder="Kaina nuo" className="w-1/2 rounded border px-3 py-2" />
            <input type="number" placeholder="Kaina iki" className="w-1/2 rounded border px-3 py-2" />
          </div>
          <button className="w-full rounded-lg bg-black text-white py-2">Ieškoti</button>
        </div>
      </aside>

      {/* Результаты */}
      <div className="md:col-span-9 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rezultatai</h1>
          <span className="text-sm text-gray-500">
            {loading ? "Kraunama…" : `${items.length} pasiūlymai`}
          </span>
        </div>

        {loading ? (
          <div className="text-gray-500">Kraunama…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">Nieko nerasta.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="rounded-lg border bg-white p-4 hover:shadow"
              >
                <div className="aspect-video w-full rounded bg-gray-100 mb-3 overflow-hidden">
                  {/* Если положишь public/placeholder-car.jpg — картинка появится */}
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-gray-700">{item.price.toLocaleString()} €</div>
                <div className="text-gray-500 text-sm">Rida: {item.mileage.toLocaleString()} km</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
