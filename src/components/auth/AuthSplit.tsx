/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import AssetIcon, { type AssetIconName } from "@/components/ui/AssetIcon";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Two-block auth card: a photo panel with what the site offers on the left, the form on the right.
 * Below lg the photo panel is hidden and only the form shows.
 */
export default function AuthSplit({ children }: { children: ReactNode }) {
  const { tr } = useLanguage();
  const points: Array<{ icon: AssetIconName; text: string }> = [
    {
      icon: "message",
      text: tr("Chat with sellers right on the site", "Rašykite pardavėjams tiesiai svetainėje", "Пишите продавцам прямо на сайте"),
    },
    {
      icon: "shield",
      text: tr("Listings can show the VIN and the SDK code", "Skelbimuose galima nurodyti VIN ir SDK kodą", "В объявлениях можно указать VIN и код SDK"),
    },
    {
      icon: "heart",
      text: tr("Save listings and come back to them later", "Išsaugokite skelbimus ir grįžkite prie jų vėliau", "Сохраняйте объявления и возвращайтесь к ним позже"),
    },
  ];

  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-background px-4 py-10 text-foreground lg:py-14">
      <div className="grid w-full max-w-sm lg:max-w-5xl lg:grid-cols-2 lg:gap-3 lg:rounded-[2rem] lg:bg-card lg:p-3 lg:shadow-card lg:ring-1 lg:ring-border">
        <aside className="relative hidden min-h-[600px] overflow-hidden rounded-[1.5rem] bg-ink lg:block">
          <img src="/images/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/10" />
          <div className="relative flex h-full flex-col p-9 text-white">
            <img src="/images/wheeliologo-dark.svg" alt="Wheelio" width={120} height={24} className="h-6 w-auto self-start" />
            <h2 className="mt-10 max-w-xs text-3xl font-extrabold leading-tight tracking-tight">
              {tr("Buy and sell cars without the hassle", "Pirkite ir parduokite automobilius be vargo", "Покупайте и продавайте авто без лишних хлопот")}
            </h2>
            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point.icon} className="flex items-center gap-3 text-[15px] font-medium text-white/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <AssetIcon name={point.icon} size={16} />
                  </span>
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="flex items-center justify-center lg:px-10 lg:py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </main>
  );
}
