"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";

/** Company, legal and help pages: topics on the left, the chosen page on the right. On phones the topics fold into a menu above the page. */
export default function InfoLayout({ children }: { children: React.ReactNode }) {
  const { tr } = useLanguage();
  const pathname = (usePathname() || "/").replace(/\/+$/, "") || "/";

  const topics = [
    { href: "/about", label: tr("About us", "Apie mus", "О нас") },
    { href: "/contacts", label: tr("Contacts and company details", "Kontaktai ir rekvizitai", "Контакты и реквизиты") },
    { href: "/rules", label: tr("Rules", "Taisyklės", "Правила") },
    { href: "/privacy", label: tr("Privacy policy", "Privatumo politika", "Политика конфиденциальности") },
    { href: "/dsa", label: tr("Digital Services Act", "Skaitmeninių paslaugų aktas", "Акт о цифровых услугах") },
    { href: "/report", label: tr("Report illegal content", "Pranešti apie neteisėtą turinį", "Сообщить о незаконном контенте") },
  ];
  const current = topics.find((t) => t.href === pathname) ?? topics[0];
  const sectionTitle = tr("Information", "Informacija", "Информация");

  return (
    <div className="page text-foreground">
      <nav aria-label={tr("Breadcrumb", "Naršymo kelias", "Навигация")} className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {tr("Home", "Pradžia", "Главная")}
        </Link>
        <AssetIcon name="chevron-right" size={14} />
        <span>{sectionTitle}</span>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-10">
        <aside>
          {/* Phones and tablets: the topic list folds into a menu. Keyed by page so it closes after choosing. */}
          <details key={pathname} className="group rounded-2xl border border-border bg-card shadow-card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sectionTitle}</span>
                <span className="block truncate font-semibold">{current.label}</span>
              </span>
              <AssetIcon name="chevron-down" size={20} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <TopicList topics={topics} pathname={pathname} />
          </details>

          <div className="sticky top-24 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
            <TopicList topics={topics} pathname={pathname} />
          </div>
        </aside>

        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  );
}

function TopicList({ topics, pathname }: { topics: { href: string; label: string }[]; pathname: string }) {
  return (
    <ul className="border-t border-border lg:border-t-0">
      {topics.map((topic) => {
        const active = topic.href === pathname;
        return (
          <li key={topic.href} className="border-b border-border last:border-b-0">
            <Link
              href={topic.href}
              aria-current={active ? "page" : undefined}
              className={`block border-l-4 px-4 py-3.5 text-[15px] leading-5 transition-colors ${
                active
                  ? "border-accent bg-accent/10 font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {topic.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
