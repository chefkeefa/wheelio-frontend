// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";

const nav = [
  { href: "/", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="relative h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* ЛОГО — у самого левого края */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 md:pl-6">
        <Link href="/" className="flex items-center" prefetch={false}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7f022d24-1b31-4803-8e40-c416838c1f51"
            alt="PirkAuto"
            className="h-11 w-auto"
          />
        </Link>
      </div>

      {/* ЦЕНТРАЛЬНОЕ МЕНЮ — остаётся в контейнере по центру */}
      <div className="container mx-auto flex h-full items-center justify-center">
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`text-2xl font-bold transition-colors hover:text-[hsl(var(--accent))] ${
                pathname === item.href ? "text-black" : "text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ПРАВЫЕ КОНТРОЛЫ — у правого края */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-3 pr-4 md:pr-6">
        <button
          className="rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
          aria-label="Theme"
        >
          <Icon name="theme" size={28} />
        </button>

        <button
          className="rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
          aria-label="Language"
        >
          <Icon name="lang" size={28} />
        </button>

        <button
          className="rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
          aria-label="Time"
        >
          <Icon name="time" size={28} />
        </button>

        <Link
          href="/login"
          prefetch={false}
          className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
        >
          <Icon name="user" size={28} />
          <span className="text-xl font-semibold">Login</span>
        </Link>
      </div>
    </header>
  );
}
