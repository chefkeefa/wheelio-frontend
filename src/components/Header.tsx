// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/search", label: "Paieška" },
  { href: "/sell",   label: "Parduoti" },
  { href: "/about",  label: "Apie" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="w-full">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Лого/бренд */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-black text-xs font-bold text-white">
            PA
          </div>
          <span className="text-lg font-semibold tracking-tight">PirkAuto</span>
        </Link>

        {/* Навигация (desktop) */}
        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition
                ${
                  isActive(item.href)
                    ? "bg-[hsl(var(--muted))] text-black"
                    : "text-gray-600 hover:bg-[hsl(var(--muted))] hover:text-black"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Действия (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-outline">Prisijungti</Link>
          <Link href="/register" className="btn">Registruotis</Link>
        </div>

        {/* Бургер (mobile) */}
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] md:hidden"
        >
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </div>
        </button>
      </div>

      {/* Мобильное меню */}
      {open && (
        <div className="bg-white md:hidden border-t border-[hsl(var(--border))]">
          <div className="container space-y-2 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-sm
                  ${
                    isActive(item.href)
                      ? "bg-[hsl(var(--muted))] text-black"
                      : "text-gray-700 hover:bg-[hsl(var(--muted))]"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1 text-center">
                Prisijungti
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn flex-1 text-center">
                Registruotis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
