"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { language } = useLanguage();

  const copy = {
    EN: {
      title: "About us",
      who: "Who we are",
      intro: "is a modern marketplace for buying and selling cars, built to make the search and purchase process simple, convenient, and transparent.",
      decision: "We know buying a car is a big decision. That’s why Wheelio focuses on clarity and speed at every step for both buyers and sellers.",
      why: "Why choose Wheelio",
      verifiedTitle: "Clear rules and reporting",
      verifiedText: "so suspicious listings can be flagged and removed.",
      filtersTitle: "Powerful filters",
      filtersText: "to quickly find the right car.",
      directTitle: "Direct communication",
      directText: "between buyers and sellers.",
      uiTitle: "Fast and responsive UI",
      uiText: "across all devices.",
      updatesTitle: "Constant updates",
      updatesText: "new features and improvements every month.",
      mission: "Our mission is to build a trusted community around car buying and selling in Lithuania and beyond — so you spend less time searching and more time driving.",
      browse: "Browse cars",
      sell: "Sell your car",
    },
    LT: {
      title: "Apie mus",
      who: "Kas mes esame",
      intro: "– šiuolaikiška automobilių pirkimo ir pardavimo platforma, sukurta tam, kad paieška ir pirkimo procesas būtų paprasti, patogūs ir skaidrūs.",
      decision: "Žinome, kad automobilio pirkimas yra svarbus sprendimas. Todėl Wheelio siekia aiškumo ir greičio kiekviename žingsnyje tiek pirkėjams, tiek pardavėjams.",
      why: "Kodėl verta rinktis Wheelio",
      verifiedTitle: "Aiškios taisyklės ir pranešimai",
      verifiedText: "apie įtartinus skelbimus, kad juos būtų galima pašalinti.",
      filtersTitle: "Patogūs filtrai",
      filtersText: "leidžia greitai rasti tinkamą automobilį.",
      directTitle: "Tiesioginis bendravimas",
      directText: "tarp pirkėjų ir pardavėjų.",
      uiTitle: "Greita ir patogi sąsaja",
      uiText: "visuose įrenginiuose.",
      updatesTitle: "Nuolatiniai atnaujinimai",
      updatesText: "naujos funkcijos ir patobulinimai kiekvieną mėnesį.",
      mission: "Mūsų tikslas – kurti patikimą automobilių pirkimo ir pardavimo bendruomenę Lietuvoje ir už jos ribų, kad mažiau laiko praleistumėte ieškodami ir daugiau – vairuodami.",
      browse: "Peržiūrėti automobilius",
      sell: "Parduoti automobilį",
    },
    RU: {
      title: "О нас",
      who: "Кто мы",
      intro: "— современная площадка для покупки и продажи автомобилей, созданная для того, чтобы поиск и покупка были простыми, удобными и прозрачными.",
      decision: "Мы понимаем, что покупка автомобиля — важное решение. Поэтому Wheelio делает каждый этап максимально понятным и быстрым как для покупателей, так и для продавцов.",
      why: "Почему выбирают Wheelio",
      verifiedTitle: "Понятные правила и жалобы",
      verifiedText: "чтобы подозрительные объявления можно было отметить и удалить.",
      filtersTitle: "Удобные фильтры",
      filtersText: "помогают быстро найти подходящий автомобиль.",
      directTitle: "Прямое общение",
      directText: "между покупателями и продавцами.",
      uiTitle: "Быстрый и адаптивный интерфейс",
      uiText: "на любых устройствах.",
      updatesTitle: "Постоянные обновления",
      updatesText: "новые функции и улучшения каждый месяц.",
      mission: "Наша цель — создать надёжное сообщество вокруг покупки и продажи автомобилей в Литве и за её пределами, чтобы вы тратили меньше времени на поиск и больше — на дорогу.",
      browse: "Смотреть автомобили",
      sell: "Продать автомобиль",
    },
  }[language];

  return (
    <div className="page text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="page-title">{copy.title}</h1>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-accent-ink md:text-3xl">{copy.who}</h2>

          <div className="mt-5 space-y-5 text-base leading-7 text-foreground/90 md:text-lg md:leading-8">
            <p>
              <strong className="text-foreground">Wheelio</strong> {copy.intro}
            </p>
            <p>{copy.decision}</p>
          </div>

          <h3 className="mt-8 text-lg font-bold text-foreground md:text-xl">{copy.why}</h3>
          <ul className="mt-4 space-y-3 text-base leading-7 text-foreground/90 md:text-lg md:leading-8">
            {[
              [copy.verifiedTitle, copy.verifiedText],
              [copy.filtersTitle, copy.filtersText],
              [copy.directTitle, copy.directText],
              [copy.uiTitle, copy.uiText],
              [copy.updatesTitle, copy.updatesText],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <span className="font-semibold text-foreground">{title}</span> {text}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 border-t border-border pt-6 text-base leading-7 text-foreground/90 md:text-lg md:leading-8">{copy.mission}</p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-base font-bold text-accent-foreground transition hover:brightness-105"
          >
            {copy.browse}
          </Link>
          <Link
            href="/sell"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-bold text-foreground transition hover:border-accent"
          >
            {copy.sell}
          </Link>
        </div>
      </div>
    </div>
  );
}
