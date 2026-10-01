"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AssetIcon from "@/components/ui/AssetIcon";
import { useLanguage } from "@/context/LanguageContext";
import { clearDraft, hasDraftContent, loadDraft, loadDraftSavedAt, type ListingDraft } from "@/lib/sellDraft";

function formatEUR(value: number) {
  try {
    return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString()} €`;
  }
}

/** The unfinished sell-page draft stored on this device, with links to continue or delete it. Renders nothing without a draft. */
export default function SellDraftCard({ className = "" }: { className?: string }) {
  const { language, tr } = useLanguage();
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const stored = loadDraft();
    if (hasDraftContent(stored)) {
      setDraft(stored);
      setSavedAt(loadDraftSavedAt());
    }
  }, []);

  if (!draft) return null;

  const title = [draft.mark, draft.model].filter(Boolean).join(" ") || tr("Untitled car", "Automobilis be pavadinimo", "Автомобиль без названия");
  // Same checks the sell page uses to mark a step as done (photos are not stored, so step 2 is left out).
  const steps = [
    Boolean(draft.mark && draft.model && draft.year && draft.engine),
    Boolean(draft.mileage && draft.description.trim()),
    Boolean(draft.price),
    Boolean(draft.city && draft.contactMethods.length),
  ];
  const done = steps.filter(Boolean).length;
  const locale = language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB";
  const facts = [
    draft.year,
    draft.mileage ? `${Number(draft.mileage).toLocaleString("lt-LT")} km` : "",
    draft.city,
  ].filter(Boolean);

  const remove = () => {
    if (!window.confirm(tr("Delete this draft?", "Ištrinti šį juodraštį?", "Удалить этот черновик?"))) return;
    clearDraft();
    setDraft(null);
  };

  return (
    <section className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{tr("Your draft", "Jūsų juodraštis", "Ваш черновик")}</h2>
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <AssetIcon name="clock" size={14} />
            {tr("Saved", "Išsaugota", "Сохранён")} {savedAt.toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <AssetIcon name="car-side" size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold text-foreground">{title}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {[draft.price ? formatEUR(Number(draft.price)) : "", ...facts].filter(Boolean).join(" · ") || tr("Nothing filled in yet", "Dar nieko neužpildyta", "Пока ничего не заполнено")}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid w-32 grid-cols-4 gap-1">
              {steps.map((ok, i) => (
                <span key={i} className={`h-1 rounded-full ${ok ? "bg-accent" : "bg-muted-foreground/25"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {tr(`${done} of 4 sections filled`, `Užpildyta ${done} iš 4 dalių`, `Заполнено ${done} из 4 разделов`)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={remove} aria-label={tr("Delete draft", "Ištrinti juodraštį", "Удалить черновик")} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-red-600">
            <AssetIcon name="trash" size={18} />
          </button>
          <Link href="/sell" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 font-bold text-accent-foreground transition hover:brightness-110 sm:flex-none">
            {tr("Continue", "Tęsti", "Продолжить")}
            <AssetIcon name="arrow-right" size={18} />
          </Link>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        {tr(
          "The draft is kept in this browser only. Photos are not stored, add them again when you continue.",
          "Juodraštis saugomas tik šioje naršyklėje. Nuotraukos nesaugomos, įkelkite jas tęsdami.",
          "Черновик хранится только в этом браузере. Фото не сохраняются, добавьте их, когда продолжите."
        )}
      </p>
    </section>
  );
}
