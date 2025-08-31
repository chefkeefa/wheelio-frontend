/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { anybody } from "@/lib/fonts";

type Size = "small" | "large";

export interface CarCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  size?: Size;
}

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

  return (
    <Link
      href={`/listing?id=${encodeURIComponent(id)}`}
      className={[
        "group block overflow-hidden rounded-2xl",
        "ring-1 ring-[hsl(var(--border))] bg-white",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]",
      ].join(" ")}
    >
      {/* media */}
      <div className={["relative w-full", isSmall ? "h-40" : "h-56", "bg-[hsl(var(--muted))]"].join(" ")}>
        <img
          src={imageUrl || "/placeholder-car.jpg"}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
      </div>

      {/* content */}
      <div className="p-4">
        <h3 className={`${anybody.className} line-clamp-2 text-[15px] font-bold text-[hsl(var(--foreground))]`}>
          {title}
        </h3>
        <div className={`${anybody.className} mt-2 text-base font-bold text-[hsl(var(--accent))]`}>
          {formatPrice(price)}
        </div>
      </div>
    </Link>
  );
}
