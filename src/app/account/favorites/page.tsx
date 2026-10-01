"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CarCard from "@/components/CarCard";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { getFavorites, type Listing } from "@/lib/listings";
import { removeFavorite } from "@/lib/pirkApi";

export default function FavoritesPage() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFavorites()
      .then(setItems)
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          router.replace("/auth/login?return=/account/favorites");
          return;
        }
        setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const remove = async (id: string) => {
    try {
      await removeFavorite(id);
      setItems((all) => all.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-extrabold md:text-5xl">{tr("Favorites", "Mėgstami", "Избранное")}</h1>
        {error && <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">{error}</div>}
        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="text-2xl font-bold">{tr("No favorites yet", "Kol kas nėra mėgstamų", "Пока нет избранного")}</h2>
            <p className="mt-2 text-muted-foreground">
              {tr("Press “Add to favorites” on a listing to save it here.", "Skelbime paspauskite „Pridėti į mėgstamus“.", "Нажмите «Добавить в избранное» на странице объявления.")}
            </p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">{tr("Browse cars", "Žiūrėti automobilius", "Смотреть автомобили")}</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <CarCard id={item.id} title={item.title} price={item.price} imageUrl={item.thumbnail} />
                <button onClick={() => remove(item.id)} className="mt-2 text-sm text-muted-foreground underline hover:text-foreground">
                  {tr("Remove from favorites", "Pašalinti iš mėgstamų", "Убрать из избранного")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
