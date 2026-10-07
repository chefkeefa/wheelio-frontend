/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import type { ListingDetail, ListingStatus } from "@/lib/listings";
import type { ListingTotals } from "@/lib/profiles";

const FALLBACK_IMAGE = "/images/no-photo.svg";

const STATUS: Record<ListingStatus, { dot: string; label: [string, string, string] }> = {
  ACTIVE: { dot: "bg-emerald-400", label: ["Active", "Aktyvus", "Активно"] },
  PENDING_PAYMENT: { dot: "bg-accent", label: ["Not published", "Nepaskelbtas", "Не опубликовано"] },
  PENDING_REVIEW: { dot: "bg-amber-300", label: ["Under review", "Tikrinamas", "На проверке"] },
  REJECTED: { dot: "bg-red-500", label: ["Rejected", "Atmestas", "Отклонено"] },
  SOLD: { dot: "bg-sky-400", label: ["Sold", "Parduota", "Продано"] },
  CLOSED: { dot: "bg-zinc-400", label: ["Withdrawn", "Išimtas", "Снято"] },
};

/** The owner's listing on their page: status, short statistics and the Statistics / Edit / Delete buttons. */
export default function OwnListingCard({
  item,
  totals,
  busy,
  onStats,
  onDelete,
}: {
  item: ListingDetail;
  totals?: ListingTotals;
  busy?: boolean;
  onStats: () => void;
  onDelete: () => void;
}) {
  const { tr, language } = useLanguage();
  const status = item.status ? STATUS[item.status] : null;
  const finished = item.status === "SOLD" || item.status === "CLOSED";
  const n = (v: number) => new Intl.NumberFormat(language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB").format(v);
  const price = new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.price);
  const title = [item.mark, item.model, item.year].filter(Boolean).join(" ") || item.title;
  const button = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold transition disabled:opacity-50";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Link href={`/listing/${item.id}`} className="relative block aspect-[16/10] shrink-0 bg-muted">
        <img
          src={item.thumbnail || FALLBACK_IMAGE}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover ${finished ? "opacity-60 grayscale" : ""}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        {status && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {tr(...status.label)}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-lg font-extrabold">{title}</h3>
        <div className="mt-0.5 text-lg font-extrabold text-accent-ink">{price}</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label={tr("Statistics", "Statistika", "Статистика")}>
          <span className="inline-flex items-center gap-1.5" title={tr("Views", "Peržiūros", "Просмотры")}>
            <AssetIcon name="eye" size={15} />
            {n(totals?.views ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5" title={tr("In favorites", "Mėgstamuose", "В избранном")}>
            <AssetIcon name="heart" size={15} />
            {n(totals?.favorites ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5" title={tr("Buyer chats", "Pokalbiai", "Чаты с покупателями")}>
            <AssetIcon name="message" size={15} />
            {n(totals?.chats ?? 0)}
          </span>
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          {finished ? (
            <span
              className={`${button} flex-1 cursor-default border border-border text-muted-foreground`}
              title={tr("Sold and withdrawn listings cannot be edited", "Parduotų ir išimtų skelbimų redaguoti negalima", "Проданные и снятые объявления не редактируются")}
            >
              <AssetIcon name="edit" size={16} />
              {tr("Edit", "Redaguoti", "Изменить")}
            </span>
          ) : (
            <Link href={`/account/listings/${item.id}/edit`} className={`${button} flex-1 border border-border hover:border-accent`}>
              <AssetIcon name="edit" size={16} />
              {tr("Edit", "Redaguoti", "Изменить")}
            </Link>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            title={tr("Delete", "Ištrinti", "Удалить")}
            aria-label={tr("Delete", "Ištrinti", "Удалить")}
            className={`${button} w-10 border border-red-500/30 px-0 text-red-600 hover:bg-red-500/10 dark:text-red-400`}
          >
            <AssetIcon name={busy ? "spinner" : "trash"} size={16} className={busy ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={onStats}
            title={tr("Statistics", "Statistika", "Статистика")}
            aria-label={tr("Statistics", "Statistika", "Статистика")}
            className={`${button} w-10 border border-border px-0 hover:border-accent hover:text-accent-ink`}
          >
            <AssetIcon name="chart" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
