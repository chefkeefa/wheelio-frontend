"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { logout, me, type AuthUser } from "@/lib/pirkApi";

function MoonIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>;
}
function SunIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /><path d="m4.93 4.93 1.41 1.41m11.32 11.32 1.41 1.41" /><path d="m6.34 17.66-1.41 1.41m14.14-14.14-1.41 1.41" /></svg>;
}
function GlobeIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>;
}
function ClockIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function UserIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>;
}
function MenuIcon({ size = 26 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
function CloseIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function CarIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 17h14M6 17v2M18 17v2"/><path d="m4 13 2-5h12l2 5v4H4z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/></svg>;
}
function SettingsIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.36.31.7.6 1 .28.28.63.5 1 .6h.1v4H21a1.7 1.7 0 0 0-1.6.4Z"/></svg>;
}
function HelpIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"/><path d="M12 18h.01"/></svg>;
}
function LogoutIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;

  const navigation = [
    { name: t("buy"), href: "/" },
    { name: t("sell"), href: "/sell" },
    { name: t("about"), href: "/about" },
  ];

  useEffect(() => {
    const storedTheme = localStorage.getItem("pirkauto-theme");
    const dark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    let alive = true;
    me().then((current) => {
      if (alive) setUser(current);
    }).catch(() => {
      if (alive) setUser(null);
    });
    return () => { alive = false; };
  }, [pathname]);

  useEffect(() => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pirkauto-theme", next ? "dark" : "light");
  };

  const doLogout = async () => {
    try { await logout(); } catch { /* session may already be gone */ }
    setUser(null);
    setAccountMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  const accountItems = [
    { href: "/account/listings", label: tr("My listings", "Mano skelbimai", "Мои объявления"), icon: <CarIcon /> },
    { href: "/account/profile", label: tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки"), icon: <SettingsIcon /> },
    ...(!user?.phoneVerified ? [{ href: "/verify-phone", label: tr("Verify phone", "Patvirtinti telefoną", "Подтвердить телефон"), icon: <UserIcon /> }] : []),
    { href: "/help", label: tr("Help", "Pagalba", "Помощь"), icon: <HelpIcon /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/95 backdrop-blur-md dark:bg-[#111111]/95">
      <div className="mx-auto flex h-[68px] w-full max-w-[1600px] items-center justify-between px-4 sm:h-[86px] sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center">
          <span className="text-[22px] font-black tracking-[-1px] text-black dark:text-white sm:text-[25px]">Wheel</span>
          <span className="text-[22px] font-black tracking-[-1px] text-[#e0ad2d] sm:text-[25px]">io</span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`relative text-[17px] font-semibold transition-colors duration-200 ${active ? "text-[#d7a42a]" : "text-black hover:text-[#d7a42a] dark:text-white"}`}>
                {item.name}
                {active && <span className="absolute -bottom-2 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#e0ad2d]" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label="Toggle theme">{darkMode ? <SunIcon /> : <MoonIcon />}</button>
          <button type="button" onClick={toggleLanguage} className="flex h-10 items-center gap-1.5 rounded-full px-2 text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label="Change language" title="EN → LT → RU"><GlobeIcon /><span className="min-w-[20px] text-xs font-bold">{language}</span></button>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label={tr("Recently viewed", "Neseniai peržiūrėta", "Недавно просмотренные")}><ClockIcon /></button>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className={`flex h-11 items-center gap-2 rounded-full px-3 font-semibold transition ${accountMenuOpen ? "bg-[#e0ad2d] text-black" : "text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"}`}
                aria-expanded={accountMenuOpen}
                aria-label={tr("Open account menu", "Atidaryti paskyros meniu", "Открыть меню аккаунта")}
              >
                <span className="hidden max-w-[130px] truncate lg:block">{user.name || user.email}</span>
                <MenuIcon size={23} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-[52px] w-[270px] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl">
                  <div className="border-b border-border px-4 py-4">
                    <div className="truncate font-bold">{[user.name, user.surname].filter(Boolean).join(" ") || user.email}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="p-2">
                    {accountItems.map((item) => (
                      <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-muted hover:text-accent">
                        {item.icon}<span>{item.label}</span>
                      </Link>
                    ))}
                    <button type="button" onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-500/10">
                      <LogoutIcon /><span>{tr("Log out", "Atsijungti", "Выйти")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="flex h-10 items-center gap-2 rounded-full px-2 text-[16px] font-medium text-black transition hover:text-[#d7a42a] dark:text-white"><UserIcon /><span>{t("login")}</span></Link>
          )}
        </div>

        <button type="button" onClick={() => setMobileMenuOpen((prev) => !prev)} className="flex h-11 w-11 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:hidden" aria-label="Open menu">{mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}</button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-black/5 bg-white px-6 pb-6 pt-4 dark:bg-[#111111] md:hidden">
          <nav className="flex flex-col">
            {navigation.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`rounded-xl px-4 py-3 text-lg font-semibold transition ${active ? "bg-[#e0ad2d]/10 text-[#d7a42a]" : "text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"}`}>{item.name}</Link>;
            })}
            {user && accountItems.map((item) => <Link key={`m-${item.href}`} href={item.href} className="rounded-xl px-4 py-3 text-lg font-semibold text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10">{item.label}</Link>)}
          </nav>

          <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4">
            <button type="button" onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-black dark:bg-white/10 dark:text-white">{darkMode ? <SunIcon /> : <MoonIcon />}</button>
            <button type="button" onClick={toggleLanguage} className="flex h-11 items-center gap-2 rounded-full bg-black/5 px-3 text-black dark:bg-white/10 dark:text-white"><GlobeIcon /><span className="text-sm font-bold">{language}</span></button>
            {user ? (
              <button type="button" onClick={doLogout} className="ml-auto flex h-11 items-center gap-2 rounded-full bg-red-500/10 px-4 font-semibold text-red-500"><LogoutIcon />{tr("Log out", "Atsijungti", "Выйти")}</button>
            ) : (
              <Link href="/auth/login" className="ml-auto flex h-11 items-center gap-2 rounded-full bg-[#e0ad2d] px-4 font-semibold text-black"><UserIcon />{t("login")}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
