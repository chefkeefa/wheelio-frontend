"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import { ApiError } from "@/lib/http";
import { isAdminUser, isSupportUser, logout, me, type AuthUser } from "@/lib/pirkApi";
import { needsPhone, usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";
import { CHATS_CHANGED_EVENT, getUnreadChats } from "@/lib/chats";

/** Unread chat messages for the signed-in user: on navigation, every minute and when a conversation is read. */
function useUnreadChats(signedIn: boolean, pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!signedIn) {
      setCount(0);
      return;
    }
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      getUnreadChats()
        .then((r) => alive && setCount(Number(r?.count) || 0))
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener(CHATS_CHANGED_EVENT, load);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener(CHATS_CHANGED_EVENT, load);
      document.removeEventListener("visibilitychange", load);
    };
  }, [signedIn, pathname]);
  return count;
}

function Badge({ count, className = "" }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground ring-2 ring-background ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
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
  const phoneConfig = usePhoneVerificationConfig();
  const unread = useUnreadChats(Boolean(user), pathname);

  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;

  // Site sections. Cars is the live marketplace (home, search and listings);
  // the other sections show a "coming soon" page for now.
  const navigation = [
    { name: tr("Cars", "Automobiliai", "Машины"), href: "/", match: ["/search", "/listing"] },
    { name: tr("Motorcycles", "Motociklai", "Мотоциклы"), href: "/motorcycles" },
    { name: tr("Car parts", "Autodalys", "Автозапчасти"), href: "/parts" },
    { name: tr("Tires", "Padangos", "Шины"), href: "/tires" },
  ];
  const isActive = (item: { href: string; match?: string[] }) =>
    (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) ||
    Boolean(item.match?.some((prefix) => pathname.startsWith(prefix)));

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
    }).catch((e) => {
      // Only a 401 means signed out; a timeout or a 5xx keeps the account shown.
      if (alive && e instanceof ApiError && e.status === 401) setUser(null);
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
    { href: "/messages", label: tr("Messages", "Žinutės", "Сообщения"), icon: <AssetIcon name="message" size={19} />, badge: unread },
    { href: "/account/favorites", label: tr("Favorites", "Mėgstami", "Избранное"), icon: <AssetIcon name="heart" size={19} /> },
    { href: "/account/profile", label: tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки"), icon: <AssetIcon name="settings" size={19} /> },
    ...(isAdminUser(user) ? [{ href: "/admin", label: tr("Administration", "Administravimas", "Администрирование"), icon: <AssetIcon name="shield" size={19} /> }] : []),
    ...(!isAdminUser(user) && isSupportUser(user) ? [{ href: "/admin/support", label: tr("Support desk", "Pagalbos centras", "Поддержка"), icon: <AssetIcon name="support-chat" size={19} /> }] : []),
    ...(needsPhone(user, phoneConfig)
      ? [{ href: "/verify-phone", label: verificationOff(phoneConfig) ? tr("Add phone", "Pridėti telefoną", "Добавить телефон") : tr("Verify phone", "Patvirtinti telefoną", "Подтвердить телефон"), icon: <AssetIcon name="phone" size={19} /> }]
      : []),
    { href: "/help", label: tr("Help", "Pagalba", "Помощь"), icon: <AssetIcon name="help" size={19} /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container relative flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/wheeliologo-light.svg"
            alt="Wheelio"
            width={594}
            height={119}
            priority
            className="h-auto w-[104px] dark:hidden sm:w-[120px]"
          />
          <Image
            src="/images/wheeliologo-dark.svg"
            alt="Wheelio"
            width={594}
            height={119}
            priority
            className="hidden h-auto w-[104px] dark:block sm:w-[120px]"
          />
        </Link>

        <nav className="ml-10 mr-auto hidden items-center gap-6 lg:flex xl:ml-14 xl:gap-8">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href} className={`relative text-[15px] font-semibold transition-colors duration-200 ${active ? "text-accent-ink" : "text-foreground hover:text-accent-ink"}`}>
                {item.name}
                {active && <span className="absolute -bottom-2 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-3">
          <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/5" aria-label="Toggle theme">{darkMode ? <AssetIcon name="sun" size={22} /> : <AssetIcon name="moon" size={22} />}</button>
          <button type="button" onClick={toggleLanguage} className="flex h-10 items-center gap-1.5 rounded-full px-2 text-foreground transition hover:bg-foreground/5" aria-label="Change language" title="EN → LT → RU"><AssetIcon name="globe" size={21} /><span className="min-w-[20px] text-xs font-bold">{language}</span></button>
          <button type="button" className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/5 xl:flex" aria-label={tr("Recently viewed", "Neseniai peržiūrėta", "Недавно просмотренные")}><AssetIcon name="clock" size={21} /></button>

          <Link href="/sell" className="flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-foreground transition hover:opacity-90"><AssetIcon name="plus" size={19} /><span>{t("sell")}</span></Link>

          {user && (
            <Link href="/messages" className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/5" aria-label={unread ? `${tr("Messages", "Žinutės", "Сообщения")} (${unread})` : tr("Messages", "Žinutės", "Сообщения")} title={tr("Messages", "Žinutės", "Сообщения")}>
              <AssetIcon name="message" size={22} />
              <Badge count={unread} className="absolute -right-0.5 -top-0.5" />
            </Link>
          )}

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className={`flex h-11 items-center gap-2 rounded-full px-3 font-semibold transition ${accountMenuOpen ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-foreground/5"}`}
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
                        {item.icon}<span>{item.label}</span>{"badge" in item && <Badge count={item.badge ?? 0} className="ml-auto" />}
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
            <Link href="/auth/login" className="flex h-10 items-center gap-2 rounded-full px-2 text-[15px] font-semibold text-foreground transition hover:text-accent-ink"><AssetIcon name="user" size={21} /><span>{t("login")}</span></Link>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && (
            <Link href="/messages" className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/5" aria-label={tr("Messages", "Žinutės", "Сообщения")}>
              <AssetIcon name="message" size={24} />
              <Badge count={unread} className="absolute right-0.5 top-0.5" />
            </Link>
          )}
          <button type="button" onClick={() => setMobileMenuOpen((prev) => !prev)} className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/5" aria-label="Open menu">{mobileMenuOpen ? <AssetIcon name="close" size={26} /> : <AssetIcon name="menu" size={26} />}</button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-3 sm:px-6 lg:hidden">
          <nav className="flex flex-col">
            {navigation.map((item) => {
              const active = isActive(item);
              return <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-3 text-base font-semibold transition ${active ? "bg-accent/10 text-accent-ink" : "text-foreground hover:bg-foreground/5"}`}>{item.name}</Link>;
            })}
            <Link href="/sell" className="rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-foreground/5">{t("sell")}</Link>
            <Link href="/about" className="rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-foreground/5">{t("about")}</Link>
            {user && accountItems.map((item) => <Link key={`m-${item.href}`} href={item.href} className="flex items-center rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-foreground/5">{item.label}{"badge" in item && <Badge count={item.badge ?? 0} className="ml-2" />}</Link>)}
          </nav>

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <button type="button" onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/5 text-foreground">{darkMode ? <AssetIcon name="sun" size={22} /> : <AssetIcon name="moon" size={22} />}</button>
            <button type="button" onClick={toggleLanguage} className="flex h-11 items-center gap-2 rounded-full bg-foreground/5 px-3 text-foreground"><AssetIcon name="globe" size={21} /><span className="text-sm font-bold">{language}</span></button>
            {user ? (
              <button type="button" onClick={doLogout} className="ml-auto flex h-11 items-center gap-2 rounded-full bg-red-500/10 px-4 font-semibold text-red-500"><AssetIcon name="logout" size={19} />{tr("Log out", "Atsijungti", "Выйти")}</button>
            ) : (
              <Link href="/auth/login" className="ml-auto flex h-11 items-center gap-2 rounded-full bg-accent px-4 font-semibold text-accent-foreground"><AssetIcon name="user" size={21} />{t("login")}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
