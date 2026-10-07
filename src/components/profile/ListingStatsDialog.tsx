"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import { getListingStats, type ListingStats } from "@/lib/profiles";

/** Owner's statistics of one listing: totals and page views per day for the last 30 days. */
export default function ListingStatsDialog({ listingId, title, onClose }: { listingId: string; title: string; onClose: () => void }) {
  const { tr, language } = useLanguage();
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [error, setError] = useState("");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getListingStats(listingId)
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [listingId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const locale = language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB";
  const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const days = stats?.days || [];
  const max = Math.max(1, ...days.map((d) => d.views));
  const shown = hover !== null ? days[hover] : null;

  const tiles = stats
    ? [
        { icon: "eye" as const, label: tr("Views", "Peržiūros", "Просмотры"), value: stats.views, note: tr(`${stats.last7Views} in 7 days`, `${stats.last7Views} per 7 d.`, `${stats.last7Views} за 7 дней`) },
        { icon: "phone" as const, label: tr("Phone shown", "Telefonas parodytas", "Показали телефон"), value: stats.contactViews },
        { icon: "heart" as const, label: tr("In favorites", "Mėgstamuose", "В избранном"), value: stats.favorites },
        { icon: "message" as const, label: tr("Buyer chats", "Pokalbiai", "Чаты с покупателями"), value: stats.chats },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr("Listing statistics", "Skelbimo statistika", "Статистика объявления")}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl ring-1 ring-border sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{tr("Statistics", "Statistika", "Статистика")}</p>
            <h2 className="mt-1 truncate text-xl font-extrabold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={tr("Close", "Uždaryti", "Закрыть")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <AssetIcon name="close" size={18} />
          </button>
        </div>

        {error && <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
        {!stats && !error && <div className="mt-5 h-64 animate-pulse rounded-xl bg-muted" />}

        {stats && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <AssetIcon name={t.icon} size={14} />
                    {t.label}
                  </div>
                  <div className="mt-1.5 text-2xl font-extrabold tabular-nums">{new Intl.NumberFormat(locale).format(t.value)}</div>
                  {t.note && <div className="text-xs text-muted-foreground">{t.note}</div>}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold">{tr("Views per day, last 30 days", "Peržiūros per dieną, 30 d.", "Просмотры по дням, 30 дней")}</h3>
                <span className="h-5 text-sm tabular-nums text-muted-foreground">
                  {shown
                    ? `${dayLabel(shown.day)}: ${shown.views} ${tr("views", "perž.", "просм.")}${shown.contactViews ? ` · ${shown.contactViews} ${tr("phone", "tel.", "тел.")}` : ""}`
                    : ""}
                </span>
              </div>
              <div className="relative mt-3 flex h-40 gap-3">
                <div className="flex w-6 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
                  <span>{max}</span>
                  <span>0</span>
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-x-0 top-1.5 border-t border-dashed border-border" />
                  <div className="absolute inset-x-0 bottom-0 border-t border-border" />
                  <div className="absolute inset-0 flex items-end gap-[2px] pt-1.5" onMouseLeave={() => setHover(null)}>
                    {days.map((d, i) => (
                      <button
                        key={d.day}
                        type="button"
                        aria-label={`${dayLabel(d.day)}: ${d.views}`}
                        onMouseEnter={() => setHover(i)}
                        onFocus={() => setHover(i)}
                        onClick={() => setHover(i)}
                        className="group flex h-full min-w-0 flex-1 items-end outline-none"
                      >
                        <span
                          style={{ height: d.views ? `${Math.max(3, (d.views / max) * 100)}%` : "2px" }}
                          className={`block w-full rounded-t-[4px] transition-colors ${d.views ? (hover === i ? "bg-accent-ink" : "bg-accent") : "bg-border"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {days.length > 0 && (
                <div className="ml-9 mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>{dayLabel(days[0].day)}</span>
                  <span>{dayLabel(days[Math.floor(days.length / 2)].day)}</span>
                  <span>{tr("today", "šiandien", "сегодня")}</span>
                </div>
              )}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              {tr(
                "A view is counted once per visitor and day; your own visits are not counted. Only you see these numbers.",
                "Peržiūra skaičiuojama kartą per dieną kiekvienam lankytojui; jūsų pačių apsilankymai neskaičiuojami. Šiuos skaičius matote tik jūs.",
                "Просмотр считается один раз в день на посетителя, ваши собственные заходы не учитываются. Эти цифры видите только вы."
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
