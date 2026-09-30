"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import { isAdminUser, isSupportUser, logout, me, type AuthUser } from "@/lib/pirkApi";

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
    // "pirkauto-theme" is the key used before the rename to Wheelio.
    const storedTheme = localStorage.getItem("wheelio-theme") ?? localStorage.getItem("pirkauto-theme");
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
    localStorage.setItem("wheelio-theme", next ? "dark" : "light");
    localStorage.removeItem("pirkauto-theme");
  };

  const doLogout = async () => {
    try { await logout(); } catch { /* session may already be gone */ }
    setUser(null);
    setAccountMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  const accountItems = [
    { href: "/account/listings", label: tr("My listings", "Mano skelbimai", "Мои объявления"), icon: <AssetIcon name="car" size={19} /> },
    { href: "/account/favorites", label: tr("Favorites", "Mėgstami", "Избранное"), icon: <AssetIcon name="heart" size={19} /> },
    { href: "/account/profile", label: tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки"), icon: <AssetIcon name="settings" size={19} /> },
    ...(isAdminUser(user) ? [{ href: "/admin", label: tr("Administration", "Administravimas", "Администрирование"), icon: <AssetIcon name="shield" size={19} /> }] : []),
    ...(!isAdminUser(user) && isSupportUser(user) ? [{ href: "/admin/support", label: tr("Support desk", "Pagalbos centras", "Поддержка"), icon: <AssetIcon name="support-chat" size={19} /> }] : []),
    ...(!user?.phoneVerified ? [{ href: "/verify-phone", label: tr("Verify phone", "Patvirtinti telefoną", "Подтвердить телефон"), icon: <AssetIcon name="phone" size={19} /> }] : []),
    { href: "/help", label: tr("Help", "Pagalba", "Помощь"), icon: <AssetIcon name="help" size={19} /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/95 backdrop-blur-md dark:bg-[#111111]/95">
      <div className="mx-auto flex h-[68px] w-full max-w-[1600px] items-center justify-between px-4 sm:h-[86px] sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/wheeliologo.svg"
            alt="Wheelio"
            width={168}
            height={35}
            priority
            className="h-auto w-[148px] sm:w-[168px]"
          />
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
          <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label="Toggle theme">{darkMode ? <AssetIcon name="sun" size={22} /> : <AssetIcon name="moon" size={22} />}</button>
          <button type="button" onClick={toggleLanguage} className="flex h-10 items-center gap-1.5 rounded-full px-2 text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label="Change language" title="EN → LT → RU"><AssetIcon name="globe" size={21} /><span className="min-w-[20px] text-xs font-bold">{language}</span></button>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10" aria-label={tr("Recently viewed", "Neseniai peržiūrėta", "Недавно просмотренные")}><AssetIcon name="clock" size={21} /></button>

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
                <AssetIcon name="menu" size={23} />
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
                      <AssetIcon name="logout" size={19} /><span>{tr("Log out", "Atsijungti", "Выйти")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="flex h-10 items-center gap-2 rounded-full px-2 text-[16px] font-medium text-black transition hover:text-[#d7a42a] dark:text-white"><AssetIcon name="user" size={21} /><span>{t("login")}</span></Link>
          )}
        </div>

        <button type="button" onClick={() => setMobileMenuOpen((prev) => !prev)} className="flex h-11 w-11 items-center justify-center rounded-full text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:hidden" aria-label="Open menu">{mobileMenuOpen ? <AssetIcon name="close" size={26} /> : <AssetIcon name="menu" size={26} />}</button>
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
            <button type="button" onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-black dark:bg-white/10 dark:text-white">{darkMode ? <AssetIcon name="sun" size={22} /> : <AssetIcon name="moon" size={22} />}</button>
            <button type="button" onClick={toggleLanguage} className="flex h-11 items-center gap-2 rounded-full bg-black/5 px-3 text-black dark:bg-white/10 dark:text-white"><AssetIcon name="globe" size={21} /><span className="text-sm font-bold">{language}</span></button>
            {user ? (
              <button type="button" onClick={doLogout} className="ml-auto flex h-11 items-center gap-2 rounded-full bg-red-500/10 px-4 font-semibold text-red-500"><AssetIcon name="logout" size={19} />{tr("Log out", "Atsijungti", "Выйти")}</button>
            ) : (
              <Link href="/auth/login" className="ml-auto flex h-11 items-center gap-2 rounded-full bg-[#e0ad2d] px-4 font-semibold text-black"><AssetIcon name="user" size={21} />{t("login")}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
