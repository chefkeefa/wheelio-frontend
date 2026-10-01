"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { anybody } from "@/lib/fonts";
import { getListingById, type ListingDetail } from "@/lib/listings";
import { useLanguage } from "@/context/LanguageContext";
import ListingActions from "@/components/ListingActions";
import AssetIcon from "@/components/ui/AssetIcon";
import ListingGallery from "@/components/ListingGallery";
import LeasingCalculator from "@/components/LeasingCalculator";
import { groupOptions } from "@/lib/carOptions";
import { bodyLabel, driveLabel, engineLabel, gearboxLabel, specSections } from "@/lib/carSpecs";

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

  const { tr } = useLanguage();

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
            "Could not load the listing. Please try again later.",
            "Nepavyko įkelti skelbimo. Bandykite vėliau.",
            "Не удалось загрузить объявление. Попробуйте позже."
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
  }, [id, tr]);

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

  const specs = data?.specs ?? null;
  const optionGroups = useMemo(() => groupOptions(data?.options ?? []), [data]);
  const optionCount = optionGroups.reduce((n, g) => n + g.options.length, 0);
  const sections = specSections(specs, tr);

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

  const volume = specs?.volumeLitres ?? data.volume;
  const engineParts = [
    engineLabel(specs?.engineType, tr) ?? (data.fuel ?? null),
    volume ? `${volume.toFixed(1)} l` : null,
    specs?.horsePower ? `${specs.horsePower} ${tr("hp", "AG", "л.с.")}` : null,
  ].filter(Boolean);
  const power = specs?.kwPower ?? data.power;
  const summary = [
    { label: tr("Year", "Metai", "Год выпуска"), value: data.year ? String(data.year) : null },
    { label: tr("Mileage", "Rida", "Пробег"), value: `${formatMileage(data.mileage)} km` },
    { label: tr("Engine", "Variklis", "Двигатель"), value: engineParts.join(", ") || null },
    { label: tr("Power", "Galia", "Мощность"), value: power ? `${power} kW` : null },
    { label: tr("Gearbox", "Pavarų dėžė", "Коробка"), value: gearboxLabel(specs?.gearbox ?? data.transmission, tr) },
    { label: tr("Drive", "Varomieji ratai", "Привод"), value: driveLabel(specs?.drive, tr) },
    { label: tr("Body type", "Kėbulo tipas", "Кузов"), value: bodyLabel(specs?.bodyType, tr) },
    {
      label: tr("Consumption", "Sąnaudos", "Расход"),
      value: specs?.consumptionMixed ? `${specs.consumptionMixed} l/100 km` : null,
    },
    { label: tr("Make", "Markė", "Марка"), value: data.mark ?? null },
    { label: tr("Model", "Modelis", "Модель"), value: data.model ?? null },
    { label: tr("Version", "Modifikacija", "Модификация"), value: specs?.modification ?? null },
    { label: tr("City", "Miestas", "Город"), value: data.city ?? null },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <main className="container mx-auto px-4 py-8 text-foreground">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <AssetIcon name="arrow-left" size={16} />
        {tr("Back to listings", "Grįžti į skelbimus", "Назад к объявлениям")}
      </Link>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        <section className="lg:col-span-7">
          <ListingGallery images={images} title={data.title} />
        </section>

        <aside className="space-y-5 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
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

            <dl className="mt-5 divide-y divide-border text-[15px]">
              {summary.map((row) => (
                <div key={row.label} className="flex gap-4 py-2">
                  <dt className="w-[42%] shrink-0 text-muted-foreground">{row.label}</dt>
                  <dd className="font-semibold text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ListingActions listingId={data.id} />

          <LeasingCalculator price={data.price} year={data.year} />

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
        </aside>

        <section className="space-y-5 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          {optionGroups.length > 0 && (
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold">
                  {tr("Equipment", "Komplektacija", "Комплектация")}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {tr(
                    `${optionCount} options`,
                    `${optionCount} pasirinkimai`,
                    `${optionCount} опций`
                  )}
                </span>
              </div>
              {data.optionsSource === "catalog" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr(
                    "Factory equipment of this version. Check the exact list with the seller.",
                    "Gamyklinė šios modifikacijos komplektacija. Tikslų sąrašą pasitikslinkite pas pardavėją.",
                    "Заводская комплектация этой модификации. Точный список уточняйте у продавца."
                  )}
                </p>
              )}
              <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                {optionGroups.map((group) => (
                  <div key={group.id} className="break-inside-avoid">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      {tr(group.en, group.lt, group.ru)}
                    </h3>
                    <ul className="space-y-1.5 text-[15px]">
                      {group.options.map((option) => (
                        <li key={option.key} className="flex items-start gap-2">
                          <AssetIcon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                          <span>{tr(option.en, option.lt, option.ru)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.length > 0 && (
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h2 className="text-xl font-bold">
                {tr("Specifications", "Techniniai duomenys", "Характеристики")}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </h3>
                    <dl className="divide-y divide-border text-sm">
                      {section.rows.map((row) => (
                        <div key={row.label} className="flex justify-between gap-4 py-2">
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="text-right font-semibold">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

