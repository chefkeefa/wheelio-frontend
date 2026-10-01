/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon, { type AssetIconName } from "@/components/ui/AssetIcon";

type Size = "small" | "large";

export interface CarCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  size?: Size;
  year?: number;
  mileage?: number;
  /** Engine volume in litres. */
  volume?: number;
  fuel?: string;
  city?: string;
  /** Shows the heart button when set. */
  onToggleFavorite?: () => void;
  favorite?: boolean;
}

const FALLBACK_IMAGE = "/images/no-photo.svg";

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat("lt-LT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} €`;
  }
}

function Spec({ icon, children }: { icon: AssetIconName; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      <AssetIcon name={icon} size={15} className="text-muted-foreground/80" />
      {children}
    </span>
  );
}

export default function CarCard({
  id,
  title,
  price,
  imageUrl,
  year,
  mileage,
  volume,
  fuel,
  city,
  onToggleFavorite,
  favorite = false,
}: CarCardProps) {
  const { tr } = useLanguage();
  const safeId = String(id ?? "").trim();

  const fuelLabel = (() => {
    if (!fuel) return "";
    const v = fuel.toLowerCase();
    if (/petrol|бенз|benz/.test(v)) return tr("Petrol", "Benzinas", "Бензин");
    if (/diesel|дизел|dyzel/.test(v)) return tr("Diesel", "Dyzelinas", "Дизель");
    if (/hybrid|гибрид|hibrid/.test(v)) return tr("Hybrid", "Hibridas", "Гибрид");
    if (/electr|электр|elektr/.test(v)) return tr("Electric", "Elektra", "Электро");
    if (/gas|газ|duj/.test(v)) return tr("Gas", "Dujos", "Газ");
    return fuel;
  })();

  const hasSpecs = Boolean((year && year > 0) || volume || (mileage && mileage > 0) || fuelLabel || city);

  return (
    <div className="group relative h-full rounded-2xl transition-transform duration-300 hover:-translate-y-1">
      <Link
        href={safeId ? `/listing/${encodeURIComponent(safeId)}` : "#"}
        aria-disabled={!safeId}
        className="flex h-full flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-card ring-1 ring-border transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={imageUrl || FALLBACK_IMAGE}
            alt={title || "Car"}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="truncate text-[15px] font-semibold leading-6 text-foreground">{title || "Wheelio"}</h3>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">{formatPrice(price)}</div>

          {hasSpecs && (
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
              {year && year > 0 ? <Spec icon="calendar">{year}</Spec> : null}
              {volume ? <Spec icon="engine">{volume.toFixed(1)} l</Spec> : null}
              {mileage && mileage > 0 ? <Spec icon="gauge">{mileage.toLocaleString("lt-LT")} km</Spec> : null}
              {fuelLabel ? <Spec icon="fuel">{fuelLabel}</Spec> : null}
              {city ? <span className="col-span-2 min-w-0 truncate"><Spec icon="map-pin">{city}</Spec></span> : null}
            </div>
          )}
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          aria-pressed={favorite}
          aria-label={favorite ? tr("Remove from favorites", "Pašalinti iš mėgstamų", "Убрать из избранного") : tr("Add to favorites", "Pridėti į mėgstamus", "Добавить в избранное")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <AssetIcon name={favorite ? "heart-filled" : "heart"} size={20} className={favorite ? "text-accent" : ""} />
        </button>
      )}
    </div>
  );
}
