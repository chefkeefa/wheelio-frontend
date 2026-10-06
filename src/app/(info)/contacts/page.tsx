"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { InfoArticle, InfoSection } from "@/components/info/InfoArticle";
import AssetIcon from "@/components/ui/AssetIcon";
import { COMPANY, HAS_COMPANY_DETAILS, SUPPORT_EMAIL } from "@/lib/company";

export default function ContactsPage() {
  const { tr } = useLanguage();

  const company = [
    [tr("Operator", "Valdytojas", "Оператор"), COMPANY.name],
    [tr("Company code", "Įmonės kodas", "Код компании"), COMPANY.code],
    [tr("VAT code", "PVM mokėtojo kodas", "Код НДС"), COMPANY.vat],
    [tr("Address", "Adresas", "Адрес"), COMPANY.address],
    [tr("Phone", "Telefonas", "Телефон"), COMPANY.phone],
  ].filter(([, value]) => value);

  return (
    <InfoArticle
      title={tr("Contacts", "Kontaktai", "Контакты")}
      intro={tr(
        "Questions about a listing, your account or a payment? Write to us, we answer every message.",
        "Turite klausimų dėl skelbimo, paskyros ar mokėjimo? Parašykite mums, atsakome į kiekvieną žinutę.",
        "Вопросы по объявлению, аккаунту или оплате? Напишите нам, мы отвечаем на каждое сообщение."
      )}
    >
      <InfoSection title={tr("Contact us", "Susisiekite", "Связаться с нами")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="rounded-xl border border-border bg-background p-5 transition hover:border-accent">
            <AssetIcon name="mail" size={24} className="text-accent-ink" />
            <p className="mt-3 font-semibold">{tr("E-mail", "El. paštas", "Эл. почта")}</p>
            <p className="mt-1 break-all text-muted-foreground">{SUPPORT_EMAIL}</p>
          </a>
          <Link href="/help" className="rounded-xl border border-border bg-background p-5 transition hover:border-accent">
            <AssetIcon name="support-chat" size={24} className="text-accent-ink" />
            <p className="mt-3 font-semibold">{tr("Online chat and help center", "Pokalbis ir pagalbos centras", "Чат и центр помощи")}</p>
            <p className="mt-1 text-muted-foreground">
              {tr("Answers to common questions and a chat with support.", "Atsakymai į dažnus klausimus ir pokalbis su pagalba.", "Ответы на частые вопросы и чат с поддержкой.")}
            </p>
          </Link>
        </div>
      </InfoSection>

      {HAS_COMPANY_DETAILS && (
        <InfoSection title={tr("Company details", "Rekvizitai", "Реквизиты")}>
          <dl className="grid gap-x-6 gap-y-2 text-[15px] leading-6 sm:grid-cols-[180px_1fr]">
            {company.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </InfoSection>
      )}

      <InfoSection title={tr("Report a suspicious listing", "Pranešti apie įtartiną skelbimą", "Пожаловаться на подозрительное объявление")}>
        <p className="text-[15px] leading-7 text-foreground/90 md:text-base">
          {tr(
            "Wheelio never asks for card details, passwords or SMS codes by e-mail, chat or phone. If a seller asks for an advance payment before you have seen the car, or sends a link to pay outside the site, write to us with the listing link.",
            "Wheelio niekada neprašo kortelės duomenų, slaptažodžių ar SMS kodų el. paštu, pokalbyje ar telefonu. Jei pardavėjas prašo avanso dar nepamačius automobilio arba siunčia nuorodą sumokėti ne svetainėje, parašykite mums ir atsiųskite skelbimo nuorodą.",
            "Wheelio никогда не запрашивает данные карты, пароли или SMS-коды по почте, в чате или по телефону. Если продавец просит предоплату до осмотра машины или присылает ссылку на оплату вне сайта, напишите нам и пришлите ссылку на объявление."
          )}
        </p>
      </InfoSection>
    </InfoArticle>
  );
}
