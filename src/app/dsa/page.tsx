"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY, SUPPORT_EMAIL } from "@/lib/company";

type Section = { id: string; title: string; items: React.ReactNode[] };

/** Information the EU Digital Services Act (Regulation (EU) 2022/2065) requires an online platform to publish. */
export default function DsaPage() {
  const { language } = useLanguage();
  const operator = [COMPANY.name, COMPANY.code && `(${COMPANY.code})`, COMPANY.address].filter(Boolean).join(" ");
  const mail = (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
      {SUPPORT_EMAIL}
    </a>
  );
  const report = (label: string) => (
    <Link href="/report" className="font-semibold underline">
      {label}
    </Link>
  );
  const rrt = (
    <a href="https://www.rrt.lt" target="_blank" rel="noopener noreferrer" className="underline">
      www.rrt.lt
    </a>
  );
  const odsList = (label: string) => (
    <a
      href="https://digital-strategy.ec.europa.eu/en/policies/dsa-out-court-dispute-settlement"
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {label}
    </a>
  );

  const copy: { title: string; updated: string; intro: string; sections: Section[] } = {
    EN: {
      title: "Digital Services Act",
      updated: "Last updated: 5 October 2026",
      intro: `Wheelio is an online platform under the EU Digital Services Act (Regulation (EU) 2022/2065, "DSA"). The service is provided by ${operator || "the operator of wheelio.lt"}. This page lists our contact points and explains how we handle reports of illegal content and moderation decisions.`,
      sections: [
        {
          id: "contact",
          title: "1. Single point of contact",
          items: [
            <>For authorities of EU Member States, the European Commission and the European Board for Digital Services (Art. 11) and for users of the service (Art. 12): {mail}.</>,
            "Languages: Lithuanian, English and Russian.",
            <>Users can also reach us through the <Link href="/help" className="underline">help center</Link> and the online chat. You will always be able to talk to a person, not only an automated system.</>,
          ],
        },
        {
          id: "report",
          title: "2. Reporting illegal content",
          items: [
            <>Anyone can {report("report illegal content")}, with or without an account. Every listing also has a “Report illegal content” link.</>,
            "Please give the exact link, explain why the content is illegal, and give your name and e-mail (not required for child sexual abuse material), and confirm that the report is accurate and complete.",
            "We confirm receipt by e-mail, a person reviews the report without undue delay and objectively, and we tell you the decision and how to contest it.",
            "If we become aware of information giving rise to a suspicion of a criminal offence involving a threat to life or safety, we inform the law enforcement authorities.",
          ],
        },
        {
          id: "moderation",
          title: "3. How we moderate",
          items: [
            <>What is allowed is set out in the <Link href="/rules" className="underline">rules</Link>. We may reject or take down a listing, or suspend an account, if it is illegal or breaches the rules.</>,
            "New listings may be checked by a moderator before publication. Automatic checks (for example, a new account or a phone number used by several sellers) only flag a listing for a person; every decision is taken by a person.",
            "Whenever we restrict a listing or an account, we send the user a statement of reasons by e-mail: what was restricted, the facts, the rule or law it relies on, whether it followed a report, and how to contest it. The reason is also shown in My listings.",
            "We do not use recommender systems based on profiling. Search results are ordered by the filters and sorting the user chooses; by default, the newest listings come first. Wheelio does not sell advertising placements.",
          ],
        },
        {
          id: "redress",
          title: "4. Contesting a decision",
          items: [
            <>Reply to the decision e-mail or write to {mail} within 6 months. A person reviews it again, free of charge.</>,
            <>You may also use a certified out-of-court dispute settlement body (Art. 21; see the {odsList("European Commission's list")}) or go to court.</>,
            <>The Digital Services Coordinator in Lithuania is the Communications Regulatory Authority (Ryšių reguliavimo tarnyba, {rrt}). You can lodge a complaint about an infringement of the DSA there.</>,
            "We may suspend, after a warning, the processing of reports from people who frequently submit manifestly unfounded reports, and users who frequently provide manifestly illegal content.",
          ],
        },
        {
          id: "users",
          title: "5. Number of users",
          items: [
            "Wheelio has far fewer than 45 million average monthly active recipients in the EU and is not a very large online platform.",
          ],
        },
      ],
    },
    LT: {
      title: "Skaitmeninių paslaugų aktas",
      updated: "Atnaujinta: 2026 m. spalio 5 d.",
      intro: `Wheelio yra interneto platforma pagal ES Skaitmeninių paslaugų aktą (Reglamentas (ES) 2022/2065, toliau – SPA). Paslaugą teikia ${operator || "wheelio.lt valdytojas"}. Šiame puslapyje nurodyti mūsų kontaktiniai centrai ir paaiškinta, kaip nagrinėjame pranešimus apie neteisėtą turinį ir priimame moderavimo sprendimus.`,
      sections: [
        {
          id: "contact",
          title: "1. Bendras kontaktinis centras",
          items: [
            <>ES valstybių narių institucijoms, Europos Komisijai ir Europos skaitmeninių paslaugų valdybai (SPA 11 str.) bei paslaugos naudotojams (SPA 12 str.): {mail}.</>,
            "Kalbos: lietuvių, anglų ir rusų.",
            <>Naudotojai taip pat gali kreiptis per <Link href="/help" className="underline">pagalbos centrą</Link> ir pokalbį internetu. Visada galėsite bendrauti su žmogumi, ne vien su automatine sistema.</>,
          ],
        },
        {
          id: "report",
          title: "2. Pranešimai apie neteisėtą turinį",
          items: [
            <>Bet kas gali {report("pranešti apie neteisėtą turinį")}, turėdamas paskyrą ar be jos. Kiekviename skelbime taip pat yra nuoroda „Pranešti apie neteisėtą turinį“.</>,
            "Nurodykite tikslią nuorodą, paaiškinkite, kodėl turinys neteisėtas, nurodykite vardą ir el. paštą (nebūtina, jei pranešate apie vaikų seksualinio išnaudojimo medžiagą) ir patvirtinkite, kad informacija tiksli ir išsami.",
            "Gavimą patvirtiname el. paštu, pranešimą be nepagrįsto delsimo ir objektyviai peržiūri žmogus, o apie sprendimą ir jo skundimo galimybes jus informuojame.",
            "Jei sužinome informacijos, leidžiančios įtarti nusikalstamą veiką, keliančią grėsmę žmogaus gyvybei ar saugumui, informuojame teisėsaugos institucijas.",
          ],
        },
        {
          id: "moderation",
          title: "3. Kaip moderuojame",
          items: [
            <>Kas leidžiama, nustatyta <Link href="/rules" className="underline">taisyklėse</Link>. Neteisėtą ar taisykles pažeidžiantį skelbimą galime atmesti ar pašalinti, o paskyrą – užblokuoti.</>,
            "Nauji skelbimai prieš paskelbiant gali būti tikrinami moderatoriaus. Automatiniai patikrinimai (pvz. nauja paskyra ar keliems pardavėjams naudojamas telefono numeris) tik pažymi skelbimą žmogui; kiekvieną sprendimą priima žmogus.",
            "Kai apribojame skelbimą ar paskyrą, naudotojui el. paštu siunčiame motyvuotą sprendimą: kas apribota, faktai, taisyklė ar teisės aktas, ar sprendimas priimtas gavus pranešimą, ir kaip jį ginčyti. Priežastis rodoma ir skiltyje „Mano skelbimai“.",
            "Profiliavimu grįstų rekomendavimo sistemų nenaudojame. Paieškos rezultatai rikiuojami pagal naudotojo pasirinktus filtrus ir rikiavimą; numatytuoju atveju pirmiausia rodomi naujausi skelbimai. Wheelio neparduoda reklamos vietų.",
          ],
        },
        {
          id: "redress",
          title: "4. Sprendimų ginčijimas",
          items: [
            <>Atsakykite į sprendimo laišką arba parašykite {mail} per 6 mėnesius. Sprendimą nemokamai iš naujo peržiūrės žmogus.</>,
            <>Taip pat galite kreiptis į sertifikuotą neteisminę ginčų sprendimo instituciją (SPA 21 str.; žr. {odsList("Europos Komisijos sąrašą")}) arba į teismą.</>,
            <>Skaitmeninių paslaugų koordinatorius Lietuvoje – Ryšių reguliavimo tarnyba ({rrt}). Jai galite pateikti skundą dėl SPA pažeidimo.</>,
            "Po įspėjimo galime laikinai nenagrinėti pranešimų iš asmenų, kurie dažnai teikia akivaizdžiai nepagrįstus pranešimus, ir sustabdyti naudotojų, kurie dažnai skelbia akivaizdžiai neteisėtą turinį, paskyras.",
          ],
        },
        {
          id: "users",
          title: "5. Naudotojų skaičius",
          items: ["Vidutinis mėnesio aktyvių Wheelio naudotojų skaičius ES yra gerokai mažesnis nei 45 milijonai; Wheelio nėra labai didelė interneto platforma."],
        },
      ],
    },
    RU: {
      title: "Акт о цифровых услугах",
      updated: "Обновлено: 5 октября 2026",
      intro: `Wheelio является онлайн-платформой по Акту ЕС о цифровых услугах (Регламент (ЕС) 2022/2065, DSA). Услугу предоставляет ${operator || "оператор wheelio.lt"}. На этой странице указаны наши контактные пункты и описано, как мы рассматриваем жалобы на незаконный контент и принимаем решения по модерации.`,
      sections: [
        {
          id: "contact",
          title: "1. Единый контактный пункт",
          items: [
            <>Для органов государств ЕС, Европейской комиссии и Европейского совета по цифровым услугам (ст. 11) и для пользователей (ст. 12): {mail}.</>,
            "Языки: литовский, английский и русский.",
            <>Также можно обратиться через <Link href="/help" className="underline">центр помощи</Link> и онлайн-чат. Вы всегда сможете общаться с человеком, а не только с автоматической системой.</>,
          ],
        },
        {
          id: "report",
          title: "2. Жалобы на незаконный контент",
          items: [
            <>Любой может {report("сообщить о незаконном контенте")}, с аккаунтом или без. В каждом объявлении также есть ссылка «Сообщить о незаконном контенте».</>,
            "Укажите точную ссылку, объясните, почему контент незаконен, укажите имя и e-mail (не обязательно для материалов сексуального насилия над детьми) и подтвердите, что сведения точны и полны.",
            "Мы подтверждаем получение по e-mail, жалобу без неоправданной задержки и объективно рассматривает человек, а о решении и способах его обжалования мы сообщаем.",
            "Если нам станет известно о возможном преступлении, угрожающем жизни или безопасности людей, мы сообщаем правоохранительным органам.",
          ],
        },
        {
          id: "moderation",
          title: "3. Как мы модерируем",
          items: [
            <>Что разрешено, описано в <Link href="/rules" className="underline">правилах</Link>. Незаконное или нарушающее правила объявление мы можем отклонить или снять, а аккаунт заблокировать.</>,
            "Новые объявления могут проверяться модератором до публикации. Автоматические проверки (например, новый аккаунт или телефон у нескольких продавцов) лишь отмечают объявление для человека; каждое решение принимает человек.",
            "Когда мы ограничиваем объявление или аккаунт, пользователь получает по e-mail мотивированное решение: что ограничено, факты, правило или закон, была ли жалоба и как обжаловать. Причина также видна в разделе «Мои объявления».",
            "Мы не используем рекомендательные системы на основе профилирования. Результаты поиска упорядочены по выбранным пользователем фильтрам и сортировке; по умолчанию сначала новые объявления. Wheelio не продаёт рекламные места.",
          ],
        },
        {
          id: "redress",
          title: "4. Обжалование решения",
          items: [
            <>Ответьте на письмо с решением или напишите на {mail} в течение 6 месяцев. Решение бесплатно повторно рассмотрит человек.</>,
            <>Также можно обратиться в сертифицированный орган внесудебного урегулирования споров (ст. 21; см. {odsList("список Европейской комиссии")}) или в суд.</>,
            <>Координатор цифровых услуг в Литве: Служба регулирования связи (Ryšių reguliavimo tarnyba, {rrt}). Туда можно подать жалобу на нарушение DSA.</>,
            "После предупреждения мы можем временно не рассматривать жалобы от тех, кто часто подаёт явно необоснованные жалобы, и блокировать пользователей, которые часто публикуют явно незаконный контент.",
          ],
        },
        {
          id: "users",
          title: "5. Число пользователей",
          items: ["Среднее число активных пользователей Wheelio в месяц в ЕС значительно меньше 45 миллионов; Wheelio не является очень крупной онлайн-платформой."],
        },
      ],
    },
  }[language];

  return (
    <div className="page text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="page-title">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.updated}</p>
        <p className="mt-4 leading-7 text-muted-foreground">{copy.intro}</p>
        <div className="mt-8 space-y-4">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/90">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
