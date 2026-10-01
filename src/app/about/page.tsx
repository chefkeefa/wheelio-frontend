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
      verifiedTitle: "Verified listings",
      verifiedText: "to reduce risk and save time.",
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
      verifiedTitle: "Patikrinti skelbimai",
      verifiedText: "padeda sumažinti riziką ir sutaupyti laiko.",
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
      verifiedTitle: "Проверенные объявления",
      verifiedText: "помогают снизить риски и сэкономить время.",
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col items-center px-4 pt-8 pb-16">
        <h1 className="text-6xl md:text-8xl lg:text-[96px] font-bold text-foreground text-center mb-8 leading-none">
          {copy.title}
        </h1>

        <section className="w-full max-w-[974px] bg-card rounded-2xl border border-border shadow-card p-8 md:p-12 mb-8">
          <h2 className="text-[48px] font-bold text-accent-ink mb-6 leading-[50px] text-center">
            {copy.who}
          </h2>

          <p className="text-foreground text-[20px] leading-8 text-center mb-6">
            <strong>Wheelio</strong> {copy.intro}
          </p>

          <div className="text-foreground text-[20px] leading-8 space-y-6 text-center">
            <p>{copy.decision}</p>

            <div className="mx-auto max-w-[760px] text-left">
              <h3 className="text-[24px] font-bold text-foreground mb-2 text-center md:text-left">
                {copy.why}
              </h3>

              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold">{copy.verifiedTitle}</span> {copy.verifiedText}</li>
                <li><span className="font-semibold">{copy.filtersTitle}</span> {copy.filtersText}</li>
                <li><span className="font-semibold">{copy.directTitle}</span> {copy.directText}</li>
                <li><span className="font-semibold">{copy.uiTitle}</span> {copy.uiText}</li>
                <li><span className="font-semibold">{copy.updatesTitle}</span> {copy.updatesText}</li>
              </ul>
            </div>

            <p>{copy.mission}</p>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 h-[60px] bg-accent border-2 border-accent rounded-lg text-[20px] font-bold text-accent-foreground hover:opacity-90 transition-opacity"
          >
            {copy.browse}
          </Link>

          <Link
            href="/sell"
            className="inline-flex items-center justify-center px-8 h-[60px] bg-card border-2 border-accent rounded-lg text-[20px] font-bold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {copy.sell}
          </Link>
        </div>
      </div>
    </main>
  );
}
