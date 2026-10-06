"use client";

import { useLanguage } from "@/context/LanguageContext";
import { InfoArticle, InfoList, InfoSection } from "@/components/info/InfoArticle";
import { COMPANY, SUPPORT_EMAIL } from "@/lib/company";

type Section = { title: string; items: string[] };

export default function PrivacyPage() {
  const { language } = useLanguage();
  const operator = [COMPANY.name, COMPANY.code && `(${COMPANY.code})`, COMPANY.address].filter(Boolean).join(" ");

  const copy: { title: string; updated: string; intro: string; sections: Section[] } = {
    EN: {
      title: "Privacy policy",
      updated: "Last updated: 5 October 2026",
      intro: `This policy explains what personal data wheelio.lt processes and why. The data controller is ${operator || "the operator of wheelio.lt"}. Contact: ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. What data we process",
          items: [
            "Account data: e-mail address, name, password (stored only as a hash) and, if you add it, your phone number.",
            "Listings: vehicle details, photos (location and camera metadata are removed on upload), price, city and description.",
            "Messages you send to support and the live chat.",
            "Payment status for paid publication. Card details are entered at the payment provider (Paysera) and never reach Wheelio.",
            "If you sign in with Google: your Google e-mail address and name.",
            "Reports of illegal content: the reporter's name, e-mail address and text, and our decision. Moderation decisions about your listings or account.",
            "Technical data: IP address and browser details in security logs, rate limits and error reports.",
          ],
        },
        {
          title: "2. Why we process it",
          items: [
            "To run your account and publish your listings (performance of the contract).",
            "To let buyers contact sellers: the phone number in a listing is shown to signed-in users.",
            "To answer support requests and prevent fraud and abuse (legitimate interest).",
            "To keep accounting records of payments (legal obligation).",
            "To handle reports of illegal content and give reasons for moderation decisions (legal obligation under the EU Digital Services Act).",
          ],
        },
        {
          title: "3. Cookies and local storage",
          items: [
            "We use only what the site needs to work: sign-in and security cookies, the live chat cookie, and your theme, language and sell-form draft stored in your browser.",
            "We do not use advertising or tracking cookies.",
          ],
        },
        {
          title: "4. Who receives the data",
          items: [
            "Hosting provider (Hostinger), e-mail provider, Paysera for payments and Google for Google sign-in, only as far as each service needs.",
            "OpenAI (USA) receives a listing photo only when the automatic photo sorting is used, to recognise what the photo shows. The transfer outside the EU is covered by the safeguards the GDPR requires (standard contractual clauses).",
            "A seller never sees who reported their listing.",
            "We do not sell personal data.",
          ],
        },
        {
          title: "5. How long we keep it",
          items: [
            "Account data and listings: while your account exists, or until you ask us to delete them.",
            "Payment records: as long as accounting law requires.",
            "Reports of illegal content: the reporter's name and e-mail are removed one year after the decision.",
            "Rate-limit records with IP addresses: up to 2 days; database backups: 14 days.",
          ],
        },
        {
          title: "6. Your rights",
          items: [
            `You can ask to see, correct, delete or export your data, or object to processing, by writing to ${SUPPORT_EMAIL}.`,
            "You may also complain to the State Data Protection Inspectorate of Lithuania (vdai.lrv.lt).",
          ],
        },
      ],
    },
    LT: {
      title: "Privatumo politika",
      updated: "Atnaujinta: 2026 m. spalio 5 d.",
      intro: `Ši politika paaiškina, kokius asmens duomenis tvarko wheelio.lt ir kodėl. Duomenų valdytojas – ${operator || "wheelio.lt valdytojas"}. Kontaktai: ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. Kokius duomenis tvarkome",
          items: [
            "Paskyros duomenys: el. pašto adresas, vardas, slaptažodis (saugomas tik kaip maiša) ir, jei jį nurodote, telefono numeris.",
            "Skelbimai: automobilio duomenys, nuotraukos (įkeliant pašalinama vietos ir fotoaparato informacija), kaina, miestas ir aprašymas.",
            "Žinutės, kurias siunčiate pagalbai ir pokalbyje internetu.",
            "Mokamo skelbimo mokėjimo būsena. Kortelės duomenys įvedami mokėjimų paslaugų teikėjo (Paysera) puslapyje ir Wheelio jų negauna.",
            "Jei prisijungiate per Google: Google el. pašto adresas ir vardas.",
            "Pranešimai apie neteisėtą turinį: pranešėjo vardas, el. pašto adresas, tekstas ir mūsų sprendimas. Moderavimo sprendimai dėl jūsų skelbimų ar paskyros.",
            "Techniniai duomenys: IP adresas ir naršyklės informacija saugumo žurnaluose, užklausų ribojimuose ir klaidų ataskaitose.",
          ],
        },
        {
          title: "2. Kodėl tvarkome",
          items: [
            "Kad veiktų jūsų paskyra ir būtų skelbiami jūsų skelbimai (sutarties vykdymas).",
            "Kad pirkėjai galėtų susisiekti su pardavėjais: skelbimo telefono numeris rodomas prisijungusiems naudotojams.",
            "Kad atsakytume į užklausas ir užkirstume kelią sukčiavimui (teisėtas interesas).",
            "Kad tvarkytume mokėjimų apskaitą (teisinė prievolė).",
            "Kad nagrinėtume pranešimus apie neteisėtą turinį ir pagrįstume moderavimo sprendimus (teisinė prievolė pagal ES Skaitmeninių paslaugų aktą).",
          ],
        },
        {
          title: "3. Slapukai ir naršyklės saugykla",
          items: [
            "Naudojame tik tai, ko reikia svetainei veikti: prisijungimo ir saugumo slapukus, pokalbio slapuką, taip pat naršyklėje saugomą temą, kalbą ir skelbimo juodraštį.",
            "Reklaminių ar sekimo slapukų nenaudojame.",
          ],
        },
        {
          title: "4. Kas gauna duomenis",
          items: [
            "Prieglobos paslaugų teikėjas (Hostinger), el. pašto paslaugų teikėjas, Paysera mokėjimams ir Google prisijungimui per Google, tik tiek, kiek reikia kiekvienai paslaugai.",
            "OpenAI (JAV) gauna skelbimo nuotrauką tik naudojant automatinį nuotraukų rūšiavimą, kad atpažintų, kas joje pavaizduota. Perdavimui už ES ribų taikomos BDAR reikalaujamos apsaugos priemonės (standartinės sutarčių sąlygos).",
            "Pardavėjas niekada nemato, kas pranešė apie jo skelbimą.",
            "Asmens duomenų neparduodame.",
          ],
        },
        {
          title: "5. Kiek laiko saugome",
          items: [
            "Paskyros duomenis ir skelbimus – kol egzistuoja paskyra arba kol paprašysite juos ištrinti.",
            "Mokėjimų įrašus – tiek, kiek reikalauja apskaitos teisės aktai.",
            "Pranešimus apie neteisėtą turinį – pranešėjo vardas ir el. paštas ištrinami praėjus metams po sprendimo.",
            "Užklausų ribojimo įrašus su IP adresais – iki 2 dienų; duomenų bazės atsargines kopijas – 14 dienų.",
          ],
        },
        {
          title: "6. Jūsų teisės",
          items: [
            `Galite prašyti susipažinti su savo duomenimis, juos ištaisyti, ištrinti, perkelti arba nesutikti su tvarkymu, parašę ${SUPPORT_EMAIL}.`,
            "Taip pat galite pateikti skundą Valstybinei duomenų apsaugos inspekcijai (vdai.lrv.lt).",
          ],
        },
      ],
    },
    RU: {
      title: "Политика конфиденциальности",
      updated: "Обновлено: 5 октября 2026",
      intro: `Здесь описано, какие персональные данные обрабатывает wheelio.lt и зачем. Контролёр данных: ${operator || "оператор wheelio.lt"}. Контакт: ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. Какие данные мы обрабатываем",
          items: [
            "Данные аккаунта: e-mail, имя, пароль (хранится только в виде хеша) и, если вы его указали, номер телефона.",
            "Объявления: данные автомобиля, фотографии (при загрузке удаляются геоданные и данные камеры), цена, город и описание.",
            "Сообщения, которые вы отправляете в поддержку и онлайн-чат.",
            "Статус оплаты платной публикации. Данные карты вводятся на стороне платёжного провайдера (Paysera) и к Wheelio не попадают.",
            "При входе через Google: ваш e-mail и имя в Google.",
            "Жалобы на незаконный контент: имя, e-mail и текст заявителя, а также наше решение. Решения модерации по вашим объявлениям или аккаунту.",
            "Технические данные: IP-адрес и данные браузера в журналах безопасности, ограничениях запросов и отчётах об ошибках.",
          ],
        },
        {
          title: "2. Зачем мы их обрабатываем",
          items: [
            "Чтобы работал ваш аккаунт и публиковались объявления (исполнение договора).",
            "Чтобы покупатели могли связаться с продавцом: телефон в объявлении видят вошедшие пользователи.",
            "Чтобы отвечать на обращения и предотвращать мошенничество (законный интерес).",
            "Чтобы вести учёт платежей (требование закона).",
            "Чтобы рассматривать жалобы на незаконный контент и обосновывать решения модерации (требование Акта ЕС о цифровых услугах).",
          ],
        },
        {
          title: "3. Cookies и хранилище браузера",
          items: [
            "Мы используем только то, что нужно для работы сайта: cookies входа и безопасности, cookie чата, а также тему, язык и черновик объявления в вашем браузере.",
            "Рекламные и отслеживающие cookies мы не используем.",
          ],
        },
        {
          title: "4. Кто получает данные",
          items: [
            "Хостинг (Hostinger), почтовый провайдер, Paysera для оплаты и Google для входа через Google, только в объёме, нужном каждому сервису.",
            "OpenAI (США) получает фото объявления только при автоматической сортировке фото, чтобы распознать, что на нём. Передача за пределы ЕС защищена мерами, которых требует GDPR (стандартные договорные условия).",
            "Продавец никогда не видит, кто пожаловался на его объявление.",
            "Мы не продаём персональные данные.",
          ],
        },
        {
          title: "5. Сколько мы храним данные",
          items: [
            "Данные аккаунта и объявления: пока существует аккаунт или пока вы не попросите их удалить.",
            "Платёжные записи: столько, сколько требует бухгалтерское законодательство.",
            "Жалобы на незаконный контент: имя и e-mail заявителя удаляются через год после решения.",
            "Записи ограничения запросов с IP-адресами: до 2 дней; резервные копии базы: 14 дней.",
          ],
        },
        {
          title: "6. Ваши права",
          items: [
            `Вы можете запросить доступ к своим данным, их исправление, удаление, перенос или возразить против обработки, написав на ${SUPPORT_EMAIL}.`,
            "Также можно подать жалобу в Государственную инспекцию по защите данных Литвы (vdai.lrv.lt).",
          ],
        },
      ],
    },
  }[language];

  return (
    <InfoArticle title={copy.title} meta={copy.updated} intro={copy.intro}>
      {copy.sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
          <InfoList items={section.items} />
        </InfoSection>
      ))}
    </InfoArticle>
  );
}
