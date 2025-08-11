// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
      <div className="container flex items-center justify-between py-4 gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7f022d24-1b31-4803-8e40-c416838c1f51"
            alt="PirkAuto"
            className="h-11 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-2xl font-bold transition-colors hover:text-[hsl(var(--accent))] ${
                pathname === item.href ? "text-black" : "text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            aria-label="Theme"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/155afc12-1cca-432b-88d5-a29631055898"
              alt="Theme"
              className="w-8 h-8"
            />
          </button>

          <button
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            aria-label="Language"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e227dbe4-3d0c-4fdc-991c-c9cb0e0914d6"
              alt="Language"
              className="w-8 h-8"
            />
          </button>

          <button
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
            aria-label="Time"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/039dc914-363a-4e9b-871d-763cb46d6eab"
              alt="Time"
              className="w-8 h-8"
            />
          </button>

          <Link
            href="/login"
            className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c641c5f5-0fa7-401c-9c03-514273c50cf3"
              alt="User"
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold">Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
