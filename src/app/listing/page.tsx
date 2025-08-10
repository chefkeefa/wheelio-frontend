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
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Левая часть — галерея-заглушка */}
      <div className="lg:col-span-7 space-y-4">
        <div className="aspect-video w-full rounded-lg bg-gray-200" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-video rounded bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Правая колонка с данными */}
      <aside className="lg:col-span-5 space-y-4">
        {loading ? (
          <div className="rounded-lg border bg-white p-5">Kraunama…</div>
        ) : err ? (
          <div className="rounded-lg border bg-white p-5 space-y-3">
            <div className="text-red-600 font-semibold">Klaida</div>
            <div className="text-sm text-gray-700">{err}</div>
            <Link href="/search" className="text-blue-600 hover:underline">
              ← Grįžti į paiešką
            </Link>
          </div>
        ) : item ? (
          <>
            <div className="rounded-lg border bg-white p-5 space-y-2">
              <h1 className="text-2xl font-bold">{item.title}</h1>
              <div className="text-2xl">{item.price.toLocaleString()} €</div>
              <div className="text-gray-600">Rida: {item.mileage.toLocaleString()} km</div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="font-semibold mb-3">Pagrindinė informacija</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="text-gray-500">Kuras:</span> {item.fuel ?? "—"}</li>
                <li><span className="text-gray-500">Pavarų dėžė:</span> {item.transmission ?? "—"}</li>
                <li><span className="text-gray-500">Galia:</span> {item.power ?? "—"}</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="font-semibold mb-3">Pardavėjas</h2>
              <div className="text-sm text-gray-700">Privatus pardavėjas</div>
              <div className="text-sm text-gray-700">Lietuva</div>
              <button className="mt-3 w-full rounded-lg bg-black text-white py-2">Siųsti žinutę</button>
            </div>

            <Link href="/search" className="block text-center text-blue-600 hover:underline">
              ← Grįžti į paiešką
            </Link>
          </>
        ) : null}
      </aside>
    </section>
  );
}

export default function ListingPage() {
  return (
    <Suspense fallback={<section className="rounded-lg border bg-white p-5">Kraunama…</section>}>
      <ListingInner />
    </Suspense>
  );
}
