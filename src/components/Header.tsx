"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        {/* Лого */}
        <Link href="/" className="font-extrabold text-xl tracking-tight">
          PirkAuto
        </Link>

        {/* Навигация */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search" className="text-gray-800 hover:text-black">
            Ieškoti
          </Link>
          <Link href="/sell" className="text-gray-800 hover:text-black">
            Parduoti
          </Link>
          <Link href="/about" className="text-gray-800 hover:text-black">
            Apie
          </Link>
        </nav>

        {/* Правый блок */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm px-3 py-2 rounded-md border border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            Prisijungti
          </Link>
          <Link
            href="/auth/register"
            className="text-sm px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Registruotis
          </Link>
        </div>
      </div>
    </header>
  );
}
