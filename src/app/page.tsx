/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CarCard from "@/components/CarCard";
import Button from "@/components/Button";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import CarSearchPanel from "@/components/search/CarSearchPanel";
import { getFavorites, getPublicListings } from "@/lib/listings";
import { addFavorite, me, removeFavorite } from "@/lib/pirkApi";
import type { Listing, ListingsQuery } from "@/lib/listings";
import { EMPTY_FILTERS, filtersToQuery, filtersToSearchParams, type CarFilters } from "@/lib/carFilters";
import { useLanguage } from "@/context/LanguageContext";
import { BACKEND_ORIGIN } from "@/lib/config";
import AssetIcon from "@/components/ui/AssetIcon";

const PAGE_SIZE = 12;
const BACKEND_URL = BACKEND_ORIGIN;

const FALLBACK_CAR_IMAGE = "/images/no-photo.svg";

function resolveListingImage(value?: string | null) {
  if (!value) return FALLBACK_CAR_IMAGE;
  const url = value.trim();
  if (!url) return FALLBACK_CAR_IMAGE;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function HomePage() {
  const { t, tr } = useLanguage();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [filters, setFilters] = useState<CarFilters>(EMPTY_FILTERS);
  const [appliedQuery, setAppliedQuery] = useState<ListingsQuery>({ sort: EMPTY_FILTERS.sort });

  const [searched, setSearched] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let alive = true;
    me()
      .then(async () => {
        if (!alive) return;
        setLoggedIn(true);
        const favorites = await getFavorites();
        if (alive) setFavoriteIds(new Set(favorites.map((x) => x.id)));
      })
      .catch(() => {
        /* guests see the heart and are sent to sign in */
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    if (!loggedIn) {
      window.location.href = "/auth/login?return=/";
      return;
    }
    const wasFavorite = favoriteIds.has(id);
    const next = (add: boolean) =>
      setFavoriteIds((prev) => {
        const copy = new Set(prev);
        if (add) copy.add(id);
        else copy.delete(id);
        return copy;
      });
    next(!wasFavorite);
    try {
      if (wasFavorite) await removeFavorite(id);
      else await addFavorite(id);
    } catch {
      next(wasFavorite);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const data = await getPublicListings({
          limit: PAGE_SIZE,
          offset: 0,
        });

        if (cancelled) return;

        setItems(data);
        setHasMore(data.length >= PAGE_SIZE);
        setOffset(data.length);
      } catch {
        if (!cancelled) {
          setItems([]);
          setHasMore(false);
          setOffset(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToResults = () =>
    window.setTimeout(() => document.getElementById("listings-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const applyFilters = async () => {
    setSearching(true);
    setSearched(true);
    const query = filtersToQuery(filters);

    try {
      const data = await getPublicListings({
        ...query,
        limit: PAGE_SIZE,
        offset: 0,
      });

      // Remember exactly the filters/sorting that produced the visible result.
      // “Load more” will continue the same query even if controls are changed later.
      setAppliedQuery(query);
      setItems(data);
      setHasMore(data.length >= PAGE_SIZE);
      setOffset(data.length);
    } catch {
      setAppliedQuery(query);
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
      const more = await getPublicListings({
        ...appliedQuery,
        limit: PAGE_SIZE,
        offset,
      });

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

  return (
    <div>
      <section className="relative">
        <div className="relative h-[420px] overflow-hidden rounded-2xl sm:h-[500px] md:h-[600px] md:rounded-none lg:h-[620px]">
          <img
            src="/images/hero.jpg"
            alt="Wheelio"
            className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
            loading="eager"
          />

          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/60 to-transparent sm:w-[75%] md:w-[60%]" />
          <div className="absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t from-black/60 to-transparent md:block" />

          <div className="container relative pt-6 md:pt-24 lg:pt-28">
            <p className="mb-4 hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 md:flex">
              <span className="h-px w-8 bg-white/70" />
              {tr("Thousands of listings in one place", "Tūkstančiai skelbimų vienoje vietoje", "Тысячи объявлений в одном месте")}
            </p>
            <h1 className="max-w-[640px] text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
              {tr("Buy or sell a car", "Pirk ar parduok automobilį", "Купи или продай автомобиль")}{" "}
              <span className="text-accent">{tr("easily", "lengvai", "легко")}</span>
            </h1>
            <p className="mt-5 hidden max-w-[440px] text-base leading-7 text-white/80 md:block md:text-lg">
              {tr(
                "A reliable platform for buying and selling cars in Lithuania and Europe.",
                "Patikima platforma automobiliams pirkti ir parduoti Lietuvoje ir Europoje.",
                "Надёжная платформа для покупки и продажи автомобилей в Литве и Европе."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="relative z-10 -mt-[88px] sm:-mt-[140px] md:-mt-[150px]">
          <CarSearchPanel
            filters={filters}
            onChange={setFilters}
            searching={searching}
            onSubmit={async () => {
              await applyFilters();
              scrollToResults();
            }}
          />
        </div>

        <div id="listings-results" className="scroll-mt-24 pt-10 md:pt-16">
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
                {searched
                  ? tr("Search results", "Paieškos rezultatai", "Результаты поиска")
                  : tr("Popular listings", "Populiarūs skelbimai", "Популярные объявления")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                {searched
                  ? tr("Listings matching your filters", "Skelbimai pagal jūsų filtrus", "Объявления по вашим фильтрам")
                  : tr("Current offers from verified sellers", "Aktualūs pasiūlymai iš patikrintų pardavėjų", "Актуальные предложения от проверенных продавцов")}
              </p>
            </div>
            <Link
              href={`/search${searched ? `?${filtersToSearchParams(filters)}` : ""}`}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent sm:inline-flex"
            >
              {tr("View all", "Žiūrėti visus", "Смотреть все")}
              <AssetIcon name="arrow-right" size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={t("noListings")}
              subtitle={t("noListingsSubtitle")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <CarCard
                  key={item.id}
                  id={item.id}
                  title={[item.mark, item.model].filter(Boolean).join(" ") || item.title}
                  price={item.price}
                  imageUrl={resolveListingImage(item.thumbnail)}
                  year={item.year}
                  mileage={item.mileage}
                  volume={item.volume}
                  fuel={item.fuel}
                  city={item.city}
                  favorite={favoriteIds.has(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </div>
          )}

          {hasMore && !loading && items.length > 0 && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="md" className="rounded-full px-8" onClick={loadMore} loading={fetchingMore}>
                {t("more")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
