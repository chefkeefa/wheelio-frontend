"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import type { Certification } from "@/lib/profiles";

/** Owner-only: what is still missing for the green "certified profile" tick, each with a link to fix it. */
export default function CertificationChecklist({ c, returnTo }: { c: Certification; returnTo: string }) {
  const { tr } = useLanguage();
  const items = [
    {
      done: c.name,
      label: tr(
        "First and last name in English letters, starting with a capital (e.g. Piotr Kowalski)",
        "Vardas ir pavardė angliškomis raidėmis, iš didžiosios raidės (pvz., Piotr Kowalski)",
        "Имя и фамилия английскими буквами, с заглавной буквы (например, Piotr Kowalski)"
      ),
      href: "/account/profile",
      action: tr("Edit", "Keisti", "Изменить"),
    },
    {
      done: c.phone,
      label: tr("Confirmed phone number", "Patvirtintas telefono numeris", "Подтверждённый номер телефона"),
      href: `/verify-phone?return=${encodeURIComponent(returnTo)}`,
      action: tr("Confirm", "Patvirtinti", "Подтвердить"),
    },
    {
      done: c.email,
      label: tr("Confirmed e-mail", "Patvirtintas el. paštas", "Подтверждённая почта"),
      href: "/account/profile",
      action: tr("Confirm", "Patvirtinti", "Подтвердить"),
    },
  ];
  return (
    <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-6">
      <p className="flex items-start gap-2 font-semibold">
        <AssetIcon name="shield" size={18} className="mt-0.5 shrink-0" />
        {tr(
          "To get the green tick (certified profile):",
          "Kad gautumėte žalią varnelę (sertifikuotas profilis):",
          "Чтобы получить зелёную галочку (сертифицированный профиль):"
        )}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-2">
            <span
              className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${it.done ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"}`}
            >
              <AssetIcon name="check" size={10} />
            </span>
            <span className={`flex-1 ${it.done ? "text-muted-foreground line-through" : ""}`}>{it.label}</span>
            {!it.done && (
              <Link href={it.href} className="shrink-0 font-semibold text-foreground underline underline-offset-2">
                {it.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
