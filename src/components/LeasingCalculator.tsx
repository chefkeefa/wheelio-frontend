"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LEASING_DEFAULTS, LEASING_TERMS, leasingEstimate, maxLeasingTerm } from "@/lib/leasing";

function eur(value: number, digits = 0) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export default function LeasingCalculator({ price, year }: { price: number; year?: number }) {
  const { tr } = useLanguage();
  const maxTerm = maxLeasingTerm(year);
  const terms = LEASING_TERMS.filter((t) => t <= maxTerm);
  const [down, setDown] = useState(LEASING_DEFAULTS.downPaymentPercent);
  const [term, setTerm] = useState(() => Math.min(LEASING_DEFAULTS.termMonths, terms[terms.length - 1] ?? 0));
  const [rate, setRate] = useState(String(LEASING_DEFAULTS.annualRate));

  if (!(price > 0)) return null;

  const title = tr("Leasing", "Lizingas", "Лизинг");

  if (!terms.length) {
    return (
      <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr(
            "Lithuanian lessors only finance cars that are at most 15 years old when the contract ends, so this car is usually bought with a consumer loan.",
            "Lietuvos lizingo bendrovės finansuoja automobilius, kurie sutarties pabaigoje nėra senesni nei 15 metų, todėl šiam automobiliui dažniau imamas vartojimo kreditas.",
            "Литовские лизинговые компании финансируют машины не старше 15 лет на конец договора, поэтому эту машину обычно берут в потребительский кредит."
          )}
        </p>
      </div>
    );
  }

  const effectiveTerm = terms.includes(term) ? term : terms[terms.length - 1];
  const parsedRate = Number(rate.replace(",", "."));
  const annualRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 30 ? parsedRate : LEASING_DEFAULTS.annualRate;
  const estimate = leasingEstimate(price, down, annualRate, effectiveTerm);

  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">{tr("estimate", "preliminariai", "примерно")}</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-accent">{eur(estimate.monthly)}</span>
        <span className="text-sm text-muted-foreground">{tr("/ month", "/ mėn.", "/ мес.")}</span>
      </div>

      <div className="mt-5 space-y-4 text-sm">
        <div>
          <div className="mb-1.5 flex justify-between">
            <label htmlFor="leasing-down" className="text-muted-foreground">
              {tr("Down payment", "Pradinė įmoka", "Первый взнос")}
            </label>
            <span className="font-semibold">
              {down}% · {eur(estimate.downPayment)}
            </span>
          </div>
          <input
            id="leasing-down"
            type="range"
            min={LEASING_DEFAULTS.minDownPaymentPercent}
            max={LEASING_DEFAULTS.maxDownPaymentPercent}
            step={5}
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
            className="w-full accent-[hsl(var(--accent))]"
          />
        </div>

        <div>
          <div className="mb-1.5 text-muted-foreground">{tr("Term", "Terminas", "Срок")}</div>
          <div className="flex flex-wrap gap-1.5">
            {terms.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                aria-pressed={t === effectiveTerm}
                className={`rounded-lg px-3 py-1.5 font-semibold ring-1 transition ${
                  t === effectiveTerm ? "bg-accent text-black ring-accent" : "bg-muted text-foreground ring-border hover:ring-foreground/40"
                }`}
              >
                {t} {tr("mo", "mėn.", "мес.")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="leasing-rate" className="text-muted-foreground">
            {tr("Interest rate, % a year", "Palūkanos, % per metus", "Ставка, % годовых")}
          </label>
          <input
            id="leasing-rate"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-20 rounded-lg bg-muted px-2 py-1.5 text-right font-semibold ring-1 ring-border outline-none focus:ring-accent"
          />
        </div>
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
        <Row label={tr("Financed amount", "Finansuojama suma", "Сумма финансирования")} value={eur(estimate.financed)} />
        <Row label={tr("Interest over the term", "Palūkanos per terminą", "Проценты за срок")} value={eur(estimate.interest)} />
        <Row label={tr("Contract fee", "Sutarties mokestis", "Плата за договор")} value={eur(estimate.fee)} />
        <Row label={tr("Total paid", "Iš viso sumokėsite", "Всего заплатите")} value={eur(estimate.total)} strong />
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {tr(
          "Based on the terms Lithuanian banks publish (Swedbank, SEB, Luminor): about 2% margin plus 6-month EURIBOR, a contract fee of 1% (at least €200), the car at most 15 years old when the contract ends. The lessor sets the final offer.",
          "Pagal Lietuvos bankų (Swedbank, SEB, Luminor) skelbiamas sąlygas: apie 2% marža ir 6 mėn. EURIBOR, 1% sutarties mokestis (ne mažiau 200 €), automobilis sutarties pabaigoje ne senesnis nei 15 metų. Galutinį pasiūlymą pateikia lizingo bendrovė.",
          "По условиям, которые публикуют литовские банки (Swedbank, SEB, Luminor): маржа около 2% плюс 6-месячный EURIBOR, плата за договор 1% (не меньше 200 €), машине на конец договора не больше 15 лет. Точное предложение даёт лизинговая компания."
        )}
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-bold text-foreground" : "font-semibold text-foreground"}>{value}</dd>
    </div>
  );
}
