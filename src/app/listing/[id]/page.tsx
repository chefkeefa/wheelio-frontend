/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { anybody } from "@/lib/fonts";
import { getListingById, type ListingDetail } from "@/lib/listings";
import { useLanguage } from "@/context/LanguageContext";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#eeeeef"/>
      <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#b0b0b3">PirkAuto</text>
      <text x="600" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#b0b0b3">No photo</text>
    </svg>
  `);

function formatPrice(value: number) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMileage(value: number) {
  return new Intl.NumberFormat("lt-LT").format(value);
}

export default function ListingDetailsPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = String(rawId ?? "").trim();

  const { language } = useLanguage();

  const tr = (en: string, lt: string, ru: string) =>
    language === "LT" ? lt : language === "RU" ? ru : en;

  const [data, setData] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getListingById(id);

        if (!alive) return;

        setData(result);
      } catch (err) {
        if (!alive) return;

        console.error("Listing load failed:", err);
        setData(null);
        setError(
          tr(
            "Could not load the listing. Check that the backend is running on port 8085.",
            "Nepavyko įkelti skelbimo. Patikrinkite, ar backend veikia 8085 prievade.",
            "Не удалось загрузить объявление. Проверьте, что backend запущен на порту 8085."
          )
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [id, language]);

  const images = useMemo(() => {
    if (!data) return [];

    const result = [
      ...(data.images ?? []),
      ...(data.thumbnail ? [data.thumbnail] : []),
    ].filter(Boolean);

    return result.filter(
      (src, index, all) => all.indexOf(src) === index
    );
  }, [data]);

  if (loading) {
    return (
      <main className="container mx-auto min-h-[55vh] px-4 py-10 text-foreground">
        {tr("Loading...", "Kraunama...", "Загрузка...")}
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container mx-auto min-h-[55vh] px-4 py-10 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 ring-1 ring-border">
          <h1 className={`${anybody.className} text-2xl font-extrabold`}>
            {tr(
              "Listing not found",
              "Skelbimas nerastas",
              "Объявление не найдено"
            )}
          </h1>

          <p className="mt-3 text-muted-foreground">
            {error ||
              tr(
                "The link is invalid, or this listing is no longer public.",
                "Nuoroda neteisinga arba šis skelbimas nebėra viešas.",
                "Ссылка неверна или это объявление больше не опубликовано."
              )}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-accent px-5 py-3 font-semibold text-black"
          >
            {tr(
              "Back to listings",
              "Grįžti į skelbimus",
              "Вернуться к объявлениям"
            )}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 text-foreground">
      <Link
        href="/"
        className="mb-5 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← {tr("Back to listings", "Grįžti į skelbimus", "Назад к объявлениям")}
      </Link>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(images.length ? images : [FALLBACK_IMAGE]).map(
              (src, index) => (
                <div
                  key={`${src}-${index}`}
                  className={`relative overflow-hidden rounded-2xl bg-muted ring-1 ring-border ${
                    index === 0 ? "sm:col-span-2 h-[420px]" : "h-52"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${data.title} ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              )
            )}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h1
              className={`${anybody.className} text-3xl font-extrabold text-foreground`}
            >
              {data.title}
            </h1>

            <div
              className={`${anybody.className} mt-3 text-3xl font-extrabold text-accent`}
            >
              {formatPrice(data.price)}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {data.mark && (
                <Info
                  label={tr("Make", "Markė", "Марка")}
                  value={data.mark}
                />
              )}
              {data.model && (
                <Info
                  label={tr("Model", "Modelis", "Модель")}
                  value={data.model}
                />
              )}
              {data.year && (
                <Info
                  label={tr("Year", "Metai", "Год")}
                  value={String(data.year)}
                />
              )}
              <Info
                label={tr("Mileage", "Rida", "Пробег")}
                value={`${formatMileage(data.mileage)} km`}
              />
            </div>
          </div>

          {data.description && (
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h2 className="mb-3 text-lg font-bold">
                {tr("Description", "Aprašymas", "Описание")}
              </h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <button className="w-full rounded-lg bg-accent px-5 py-3 font-bold text-black">
              {tr(
                "Contact seller",
                "Susisiekti su pardavėju",
                "Связаться с продавцом"
              )}
            </button>

            <button className="mt-3 w-full rounded-lg border border-border bg-background px-5 py-3 font-semibold text-foreground">
              {tr(
                "Add to favorites",
                "Pridėti į mėgstamus",
                "Добавить в избранное"
              )}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}
