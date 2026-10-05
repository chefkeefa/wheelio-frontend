"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import { COMPANY, HAS_COMPANY_DETAILS, SUPPORT_EMAIL } from "@/lib/company";

export default function Footer() {
  const { tr } = useLanguage();

  const columns = [
    {
      title: tr("Listings", "Skelbimai", "Объявления"),
      links: [
        { href: "/search", label: tr("Cars", "Automobiliai", "Машины") },
        { href: "/motorcycles", label: tr("Motorcycles", "Motociklai", "Мотоциклы") },
        { href: "/parts", label: tr("Car parts", "Autodalys", "Автозапчасти") },
        { href: "/tires", label: tr("Tires", "Padangos", "Шины") },
        { href: "/sell", label: tr("Sell a car", "Parduoti automobilį", "Продать автомобиль") },
      ],
    },
    {
      title: "Wheelio",
      links: [
        { href: "/about", label: tr("About us", "Apie mus", "О нас") },
        { href: "/contacts", label: tr("Contacts", "Kontaktai", "Контакты") },
        { href: "/help", label: tr("Help center", "Pagalbos centras", "Центр помощи") },
        { href: "/rules", label: tr("Rules", "Taisyklės", "Правила") },
        { href: "/privacy", label: tr("Privacy policy", "Privatumo politika", "Политика конфиденциальности") },
        { href: "/dsa", label: tr("Digital Services Act", "Skaitmeninių paslaugų aktas", "Акт о цифровых услугах") },
        { href: "/report", label: tr("Report illegal content", "Pranešti apie neteisėtą turinį", "Сообщить о незаконном контенте") },
      ],
    },
  ];

  const companyLine = [
    COMPANY.name,
    COMPANY.code && `${tr("Company code", "Įmonės kodas", "Код компании")} ${COMPANY.code}`,
    COMPANY.vat && `${tr("VAT", "PVM kodas", "НДС")} ${COMPANY.vat}`,
    COMPANY.address,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="container grid grid-cols-2 gap-x-6 gap-y-10 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:py-14">
        <div className="col-span-2 max-w-xs md:col-span-1">
          <Link href="/" aria-label="Wheelio">
            <img src="/images/wheeliologo-light.svg" alt="Wheelio" width={100} height={20} className="h-5 w-auto dark:hidden" />
            <img src="/images/wheeliologo-dark.svg" alt="Wheelio" width={100} height={20} className="hidden h-5 w-auto dark:block" />
          </Link>
          <p className="mt-4 leading-6 text-muted-foreground">
            {tr(
              "Car, motorcycle and parts listings in Lithuania. Private sellers and dealers publish here, buyers contact them directly.",
              "Automobilių, motociklų ir dalių skelbimai Lietuvoje. Čia skelbiasi privatūs pardavėjai ir įmonės, o pirkėjai su jais susisiekia tiesiogiai.",
              "Объявления об автомобилях, мотоциклах и запчастях в Литве. Здесь публикуются частные продавцы и компании, покупатели связываются с ними напрямую."
            )}
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-semibold text-foreground">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 md:col-span-1">
          <p className="font-semibold text-foreground">{tr("Contact us", "Susisiekite", "Связаться с нами")}</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                <AssetIcon name="mail" size={16} />
                {SUPPORT_EMAIL}
              </a>
            </li>
            {COMPANY.phone && (
              <li>
                <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                  <AssetIcon name="phone" size={16} />
                  {COMPANY.phone}
                </a>
              </li>
            )}
            <li>
              <Link href="/help" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                <AssetIcon name="support-chat" size={16} />
                {tr("Online chat", "Pokalbis internetu", "Онлайн-чат")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-1 py-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Wheelio</p>
          {HAS_COMPANY_DETAILS && <p>{companyLine}</p>}
        </div>
      </div>
    </footer>
  );
}
