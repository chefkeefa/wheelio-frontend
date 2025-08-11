// src/app/listing/page.tsx
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
  fuel?: string;
  transmission?: string;
  power?: string;
};

const API_BASE = "https://pirkauto-backend.onrender.com/api/public";

function ListingInner() {
  const params = useSearchParams();
  const id = useMemo(() => params.get("id") ?? "", [params]);

  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setErr("Nenurodytas ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    fetch(`${API_BASE}/listings/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: Listing) => setItem(data))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Nepavyko įkelti skelbimo";
        setErr(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="space-y-4">
      {/* хлебные крошки */}
      <div className="text-sm text-[hsl(var(--muted-fg))]">
        <Link href="/search" className="hover:underline">Paieška</Link>
        <span className="mx-2">/</span>
        <span>Skelbimas</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 card h-[50vh] animate-pulse" />
          <div className="lg:col-span-5 space-y-4">
            <div className="card h-28 animate-pulse" />
            <div className="card h-40 animate-pulse" />
            <div className="card h-36 animate-pulse" />
          </div>
        </div>
      ) : err ? (
        <div className="card p-5 space-y-3">
          <div className="text-red-600 font-semibold">Klaida</div>
          <div className="text-sm text-gray-700">{err}</div>
          <Link href="/search" className="link">← Grįžti į paiešką</Link>
        </div>
      ) : item ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Левая колонка — фото и галерея */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-[hsl(var(--muted))]">
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[hsl(var(--muted-fg))]">
                    Nuotrauka nepateikta
                  </div>
                )}
              </div>
            </div>

            {/* мини-галерея — плейсхолдеры под будущие фото */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card h-16 bg-[hsl(var(--muted))]" />
              ))}
            </div>
          </div>

          {/* Правая колонка — панели с данными */}
          <aside className="lg:col-span-5 space-y-4">
            {/* Заголовок + цена */}
            <div className="card p-5 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
              <div className="text-2xl font-semibold">{item.price.toLocaleString()} €</div>
              <div className="text-[hsl(var(--muted-fg))]">Rida: {item.mileage.toLocaleString()} km</div>
            </div>

            {/* Характеристики */}
            <div className="card p-5">
              <h2 className="mb-3 text-xl font-semibold">Pagrindinė informacija</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-[hsl(var(--muted-fg))]">Kuras</dt>
                  <dd className="text-gray-900">{item.fuel ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[hsl(var(--muted-fg))]">Pavarų dėžė</dt>
                  <dd className="text-gray-900">{item.transmission ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[hsl(var(--muted-fg))]">Galia</dt>
                  <dd className="text-gray-900">{item.power ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[hsl(var(--muted-fg))]">Būklė</dt>
                  <dd className="text-gray-900">—</dd>
                </div>
              </dl>
            </div>

            {/* Контакты/действия */}
            <div className="card p-5 space-y-3">
              <h2 className="text-xl font-semibold">Pardavėjas</h2>
              <div className="text-sm text-gray-700">Privatus pardavėjas · Lietuva</div>
              <button className="btn w-full">Siųsti žinutę</button>
              <Link href="/search" className="block text-center link">
                ← Grįžti į paiešką
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

export default function ListingPage() {
  return (
    <Suspense fallback={<section className="card p-5">Kraunama…</section>}>
      <ListingInner />
    </Suspense>
  );
}
