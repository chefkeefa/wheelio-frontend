"use client";

import Link from "next/link";
import AssetIcon, { type AssetIconName } from "@/components/ui/AssetIcon";
import { useLanguage } from "@/context/LanguageContext";

export type ComingSoonSection = "motorcycles" | "parts" | "tires";

const SECTIONS: Record<ComingSoonSection, { icon: AssetIconName; title: [string, string, string]; text: [string, string, string] }> = {
  motorcycles: {
    icon: "motorcycle",
    title: ["Motorcycles", "Motociklai", "Мотоциклы"],
    text: [
      "Motorcycle listings are coming to Wheelio soon. For now you can browse and sell cars.",
      "Motociklų skelbimai Wheelio atsiras jau greitai. Kol kas galite ieškoti ir parduoti automobilius.",
      "Объявления о мотоциклах скоро появятся на Wheelio. Пока можно искать и продавать автомобили.",
    ],
  },
  parts: {
    icon: "wrench",
    title: ["Car parts", "Autodalys", "Автозапчасти"],
    text: [
      "A car parts section is coming to Wheelio soon. For now you can browse and sell cars.",
      "Autodalių skiltis Wheelio atsiras jau greitai. Kol kas galite ieškoti ir parduoti automobilius.",
      "Раздел автозапчастей скоро появится на Wheelio. Пока можно искать и продавать автомобили.",
    ],
  },
  tires: {
    icon: "tire",
    title: ["Tires", "Padangos", "Шины"],
    text: [
      "Tire and wheel listings are coming to Wheelio soon. For now you can browse and sell cars.",
      "Padangų ir ratlankių skelbimai Wheelio atsiras jau greitai. Kol kas galite ieškoti ir parduoti automobilius.",
      "Объявления о шинах и дисках скоро появятся на Wheelio. Пока можно искать и продавать автомобили.",
    ],
  },
};

/** Placeholder page for site sections that are not open yet. */
export default function ComingSoon({ section }: { section: ComingSoonSection }) {
  const { language } = useLanguage();
  const pick = ([en, lt, ru]: [string, string, string]) => (language === "LT" ? lt : language === "RU" ? ru : en);
  const config = SECTIONS[section];

  return (
    <div className="page text-foreground">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
          <AssetIcon name={config.icon} size={34} />
        </span>
        <span className="mt-6 rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {pick(["Coming soon", "Jau greitai", "Скоро"])}
        </span>
        <h1 className="page-title mt-3">{pick(config.title)}</h1>
        <p className="page-lead">{pick(config.text)}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-foreground transition hover:opacity-90">
            <AssetIcon name="car" size={20} />
            {pick(["Browse cars", "Žiūrėti automobilius", "Смотреть машины"])}
          </Link>
          <Link href="/sell" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 font-semibold text-foreground transition hover:bg-muted">
            {pick(["Sell a car", "Parduoti automobilį", "Продать машину"])}
          </Link>
        </div>
      </div>
    </div>
  );
}
