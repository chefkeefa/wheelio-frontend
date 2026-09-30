"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { language } = useLanguage();
  const copy = {
    EN: { about: "About us", help: "Help", rules: "Rules" },
    LT: { about: "Apie mus", help: "Pagalba", rules: "Taisyklės" },
    RU: { about: "О нас", help: "Помощь", rules: "Правила" },
  }[language];

  return (
    <footer className="mt-16 border-t border-accent bg-card text-foreground">
      <div className="container py-8">
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/about" className="text-lg font-medium text-foreground/70 transition-colors hover:text-foreground">
            {copy.about}
          </Link>
          <Link href="/help" className="text-lg font-medium text-foreground/70 transition-colors hover:text-foreground">
            {copy.help}
          </Link>
          <Link href="/rules" className="text-lg font-medium text-foreground/70 transition-colors hover:text-foreground">
            {copy.rules}
          </Link>
        </div>
      </div>
    </footer>
  );
}
