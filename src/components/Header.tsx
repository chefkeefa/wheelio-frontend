// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const nav = [
  { href: "/", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="relative h-24 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* ЛОГО — у самого левого края */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-6 md:pl-8">
        <Link href="/" className="flex items-center" prefetch={false}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7f022d24-1b31-4803-8e40-c416838c1f51"
            alt="PirkAuto"
            className="h-11 w-auto"
          />
        </Link>
      </div>

      {/* ЦЕНТРАЛЬНОЕ МЕНЮ — расширили контейнер */}
      <div className="mx-auto w-full max-w-[1440px] lg:max-w-[1600px] 2xl:max-w-[1920px] px-6 md:px-8 flex h-full items-center justify-center">
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
      <div className="absolute inset-y-0 right-0 flex items-center gap-3 pr-6 md:pr-8">
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

        {/* Authentication Section */}
        {isAuthenticated ? (
          <div className="relative">
            {/* Favorites Link */}
            <Link
              href="/favorites"
              className="flex items-center gap-2 rounded-lg p-2 mr-2 transition-colors hover:bg-[hsl(var(--muted))]"
              aria-label="Favorites"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            
            {/* User Menu */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
            >
              <Icon name="user" size={28} />
              <span className="text-xl font-semibold">{user?.firstName}</span>
            </button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <Link
                    href="/favorites"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Favorites
                  </Link>
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Messages
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth/login"
            prefetch={false}
            className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--muted))]"
          >
            <Icon name="user" size={28} />
            <span className="text-xl font-semibold">Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
