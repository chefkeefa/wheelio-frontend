"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "EN" | "LT" | "RU";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  /** Inline EN/LT/RU choice. Stable while the language does not change, so it is safe in hook dependencies. */
  tr: (en: string, lt: string, ru: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  EN: {
    buy: "Buy",
    sell: "Sell",
    about: "About",
    login: "Login",
    heroLine1: "buy and",
    heroLine2: "sell a car",
    heroLine3: "easily!",
    mark: "Mark",
    model: "Model",
    registration: "1st registration form",
    mileage: "Mileage up to",
    priceRange: "Price range",
    min: "Min",
    max: "Max",
    searchOffers: "Search offers",
    moreFilters: "More filters",
    reset: "Reset",
    any: "Any",
    more: "More",
    latestListings: "Latest listings",
    noListings: "No listings found",
    noListingsSubtitle: "Try widening your filters or reset them.",
  },
  LT: {
    buy: "Pirkti",
    sell: "Parduoti",
    about: "Apie mus",
    login: "Prisijungti",
    heroLine1: "pirk ir",
    heroLine2: "parduok automobilį",
    heroLine3: "lengvai!",
    mark: "Markė",
    model: "Modelis",
    registration: "Pirmos registracijos metai",
    mileage: "Rida iki",
    priceRange: "Kainos intervalas",
    min: "Min.",
    max: "Maks.",
    searchOffers: "Ieškoti pasiūlymų",
    moreFilters: "Daugiau filtrų",
    reset: "Atstatyti",
    any: "Bet kuri",
    more: "Daugiau",
    latestListings: "Naujausi skelbimai",
    noListings: "Skelbimų nerasta",
    noListingsSubtitle: "Pakeiskite filtrus arba juos atstatykite.",
  },
  RU: {
    buy: "Купить",
    sell: "Продать",
    about: "О нас",
    login: "Войти",
    heroLine1: "купи и",
    heroLine2: "продай автомобиль",
    heroLine3: "легко!",
    mark: "Марка",
    model: "Модель",
    registration: "Год первой регистрации",
    mileage: "Пробег до",
    priceRange: "Диапазон цены",
    min: "Мин.",
    max: "Макс.",
    searchOffers: "Найти объявления",
    moreFilters: "Больше фильтров",
    reset: "Сбросить",
    any: "Любая",
    more: "Показать ещё",
    latestListings: "Новые объявления",
    noListings: "Объявления не найдены",
    noListingsSubtitle: "Измените фильтры или сбросьте их.",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function htmlLang(language: Language) {
  if (language === "LT") return "lt";
  if (language === "RU") return "ru";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // EN is used on the server and for the first browser render.
  // The saved language is restored only after hydration, avoiding mismatch errors.
  const [language, setLanguageState] = useState<Language>("EN");

  useEffect(() => {
    const saved = (localStorage.getItem("wheelio-language") ?? localStorage.getItem("pirkauto-language"));
    if (saved === "EN" || saved === "LT" || saved === "RU") {
      setLanguageState(saved);
      document.documentElement.lang = htmlLang(saved);
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem("wheelio-language", nextLanguage);
    document.documentElement.lang = htmlLang(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    if (language === "EN") return setLanguage("LT");
    if (language === "LT") return setLanguage("RU");
    setLanguage("EN");
  }, [language, setLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key: string) => translations[language][key] ?? translations.EN[key] ?? key,
      tr: (en: string, lt: string, ru: string) => (language === "LT" ? lt : language === "RU" ? ru : en),
    }),
    [language, setLanguage, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
