"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { language } = useLanguage();
  const copy = {
    EN: { about: "About us", help: "Help", rules: "Rules", tagline: "Car marketplace for the Baltics" },
    LT: { about: "Apie mus", help: "Pagalba", rules: "Taisyklės", tagline: "Automobilių skelbimai Baltijos šalyse" },
    RU: { about: "О нас", help: "Помощь", rules: "Правила", tagline: "Автомобильные объявления в Балтии" },
  }[language];

  const links = [
    { href: "/about", label: copy.about },
    { href: "/help", label: copy.help },
    { href: "/rules", label: copy.rules },
  ];

  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="container flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6 text-muted-foreground">
          © {new Date().getFullYear()} Wheelio · {copy.tagline}
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
