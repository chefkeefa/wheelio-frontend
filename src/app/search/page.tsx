// src/app/search/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CarCard from "@/components/CarCard";
import Button from "@/components/Button";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import CarSearchPanel from "@/components/search/CarSearchPanel";
import { getPublicListings, type Listing } from "@/lib/listings";
import { filtersFromSearchParams, filtersToQuery, filtersToSearchParams, type CarFilters } from "@/lib/carFilters";
import { useLanguage } from "@/context/LanguageContext";

const PAGE_SIZE = 24;

function SearchInner() {
  const { t, tr } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const createdId = params.get("created");

  // Filters in the form, and the filters that produced the visible results.
  const [filters, setFilters] = useState<CarFilters>(() => filtersFromSearchParams(params));
  const [applied, setApplied] = useState<CarFilters>(filters);

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicListings({ ...filtersToQuery(applied), limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setHasMore(data.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied]);

  const search = () => {
    setApplied(filters);
    const query = filtersToSearchParams(filters).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const loadMore = async () => {
    if (!hasMore || fetchingMore) return;
    setFetchingMore(true);
    try {
      const more = await getPublicListings({ ...filtersToQuery(applied), limit: PAGE_SIZE, offset: items.length });
      setItems((prev) => [...prev, ...more]);
      setHasMore(more.length >= PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setFetchingMore(false);
    }
  };

  return (
    <section className="container space-y-6 py-4 md:py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
        {tr("Cars for sale", "Parduodami automobiliai", "Автомобили в продаже")}
      </h1>

      <CarSearchPanel filters={filters} onChange={setFilters} onSubmit={search} searching={loading && items.length === 0} />

      {createdId ? (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {tr(`Listing #${createdId} was created.`, `Skelbimas #${createdId} sėkmingai sukurtas.`, `Объявление #${createdId} создано.`)}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t("noListings")} subtitle={t("noListingsSubtitle")} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <CarCard
              key={item.id}
              id={item.id}
              title={[item.mark, item.model].filter(Boolean).join(" ") || item.title}
              price={item.price}
              imageUrl={item.thumbnail}
              year={item.year}
              mileage={item.mileage}
              volume={item.volume}
              fuel={item.fuel}
            />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" size="md" className="rounded-full px-8" onClick={loadMore} loading={fetchingMore}>
            {t("more")}
          </Button>
        </div>
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<section className="min-h-[55vh]" />}>
      <SearchInner />
    </Suspense>
  );
}
