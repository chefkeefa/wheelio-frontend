/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { anybody } from "@/lib/fonts";

type Size = "small" | "large";

export interface CarCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  size?: Size;
}

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#eeeeef"/>
      <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#b0b0b3">Wheelio</text>
      <text x="600" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#b0b0b3">No photo</text>
    </svg>
  `);

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

export default function CarCard({
  id,
  title,
  price,
  imageUrl,
  size = "large",
}: CarCardProps) {
  const isSmall = size === "small";
  const safeId = String(id ?? "").trim();

  return (
    <Link
      href={safeId ? `/listing/${encodeURIComponent(safeId)}` : "#"}
      aria-disabled={!safeId}
      className="group block overflow-hidden rounded-2xl bg-card text-foreground ring-1 ring-border transition-all duration-300 hover:-translate-y-[2px] hover:shadow-xl"
    >
      <div className={`relative w-full ${isSmall ? "h-40" : "h-56"} bg-muted`}>
        <img
          src={imageUrl || FALLBACK_IMAGE}
          alt={title || "Car"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
      </div>

      <div className="min-h-[92px] bg-card p-4 text-foreground">
        <h3
          className={`${anybody.className} line-clamp-2 text-[15px] font-bold text-foreground`}
        >
          {title || "Wheelio"}
        </h3>

        <div
          className={`${anybody.className} mt-2 text-base font-bold text-accent`}
        >
          {formatPrice(price)}
        </div>
      </div>
    </Link>
  );
}
