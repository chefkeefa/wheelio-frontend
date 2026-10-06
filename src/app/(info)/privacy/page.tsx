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
      updated: "Last updated: 6 October 2026",
      intro: `This policy explains what personal data wheelio.lt processes, why, and what rights you have under the EU General Data Protection Regulation (GDPR). The data controller is ${operator || "the operator of wheelio.lt named on the Contacts page"}. Contact for any data protection question: ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. What data we process",
          items: [
            "Account data: e-mail address, first and last name, city, address, post code, phone number and password (stored only as a hash).",
            "Listings: vehicle details, the owner declaration code (SDK), photos (location and camera metadata are removed on upload), price, city and description.",
            "Shown publicly in your listings: the vehicle data, photos, price, city and the name in your account as the seller. Your phone number is shown only to signed-in users.",
            "Messages you send to support and the live chat.",
            "Payment status for paid publication. Card and bank details are entered at the payment provider (Paysera) and never reach Wheelio.",
            "If you sign in with Google: your Google e-mail address and name.",
            "Reports of illegal content: the reporter's name, e-mail address and text, and our decision. Moderation decisions about your listings or account.",
            "Technical data: IP address and browser details in security logs, rate limits and error reports.",
          ],
        },
        {
          title: "2. Why we process it and on what legal basis",
          items: [
            "To create and run your account and publish your listings: performance of the contract (GDPR Art. 6(1)(b)). E-mail, name and password are needed to open an account, and a phone number to publish a listing; without them we cannot provide the service.",
            "To let buyers contact sellers and show the seller's name and phone in a listing: performance of the contract.",
            "To answer support requests, keep the site secure and prevent fraud and abuse: our legitimate interest (Art. 6(1)(f)).",
            "To keep accounting records of payments: legal obligation (Art. 6(1)(c)).",
            "To handle reports of illegal content, give reasons for moderation decisions and answer requests of authorities: legal obligation under the EU Digital Services Act.",
            "We do not use your data for advertising or profiling, and we do not sell it.",
          ],
        },
        {
          title: "3. Cookies and local storage",
          items: [
            "We use only cookies and browser storage that the site needs to work, so no consent banner is required. We use no advertising, analytics or tracking cookies.",
            "wheelio_access (15 minutes) and wheelio_refresh (30 days): keep you signed in. XSRF-TOKEN (1 hour): protects forms against forged requests. wheelio_known (180 days): remembers a browser where you signed in, to protect against password guessing. wheelio_google_state (10 minutes): protects Google sign-in. wheelio_support_chat (30 days): links your browser to your live chat.",
            "Browser storage (not sent to us): your theme, language, live chat and sell-form draft.",
          ],
        },
        {
          title: "4. Who receives the data",
          items: [
            "Hostinger (Lithuania): hosting of the site, the database and e-mail.",
            "Paysera (Lithuania): payments for paid publication.",
            "Google: only if you use Google sign-in.",
            "Twilio (USA): your phone number and a code, only when phone confirmation by SMS is switched on.",
            "OpenAI (USA): a listing photo, only when automatic photo sorting is used, to recognise what the photo shows.",
            "NHTSA vPIC (USA): when you decode a VIN in the sell form, your browser sends only the VIN to this public database.",
            "Courts, law enforcement and other authorities, only when the law requires it.",
            "A seller never sees who reported their listing.",
          ],
        },
        {
          title: "5. Transfers outside the EU",
          items: [
            "Transfers to Twilio, OpenAI and Google in the USA are protected by the EU–US Data Privacy Framework or the European Commission's standard contractual clauses (GDPR Art. 45–46).",
          ],
        },
        {
          title: "6. How long we keep it",
          items: [
            "Account data and listings: while your account exists. When you delete your account, your listings are closed and your personal data is deleted or anonymised.",
            "Support tickets: anonymised when you delete your account.",
            "Payment records: as long as Lithuanian accounting law requires.",
            "Reports of illegal content: the reporter's name and e-mail are removed one year after the decision.",
            "Rate-limit records with IP addresses: up to 2 days; database backups: 14 days.",
          ],
        },
        {
          title: "7. Automated processing",
          items: [
            "Automatic checks (for example, a new account or a phone number used by several sellers) only flag a listing for a moderator. We take no decisions with legal or similarly significant effect about you by automated means alone.",
          ],
        },
        {
          title: "8. Your rights",
          items: [
            "You have the right to access, correct and delete your data, to restrict its processing, to receive it in a portable format, and to object to processing based on our legitimate interest.",
            `You can delete your account yourself in your profile. For anything else, write to ${SUPPORT_EMAIL}. We answer within one month.`,
            "You may complain to the State Data Protection Inspectorate of Lithuania (Valstybinė duomenų apsaugos inspekcija, L. Sapiegos g. 17, LT-10312 Vilnius, www.vdai.lrv.lt) or to the data protection authority of your country.",
          ],
        },
        {
          title: "9. Security, age and changes",
          items: [
            "We use encrypted connections (HTTPS), store passwords only as hashes, and give staff access to data only as far as their work needs.",
            "Wheelio is meant for people aged 18 and over.",
            "We publish changes to this policy on this page with a new date and tell registered users about significant changes by e-mail.",
          ],
        },
      ],
    },
    LT: {
      title: "Privatumo politika",
      updated: "Atnaujinta: 2026 m. spalio 6 d.",
      intro: `Ši politika paaiškina, kokius asmens duomenis tvarko wheelio.lt, kodėl ir kokias teises jums suteikia ES Bendrasis duomenų apsaugos reglamentas (BDAR). Duomenų valdytojas – ${operator || "wheelio.lt valdytojas, nurodytas puslapyje „Kontaktai ir rekvizitai“"}. Visais duomenų apsaugos klausimais rašykite ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. Kokius duomenis tvarkome",
          items: [
            "Paskyros duomenys: el. pašto adresas, vardas ir pavardė, miestas, adresas, pašto kodas, telefono numeris ir slaptažodis (saugomas tik kaip maiša).",
            "Skelbimai: automobilio duomenys, savininko deklaravimo kodas (SDK), nuotraukos (įkeliant pašalinama vietos ir fotoaparato informacija), kaina, miestas ir aprašymas.",
            "Viešai skelbime rodoma: automobilio duomenys, nuotraukos, kaina, miestas ir jūsų paskyros vardas kaip pardavėjo. Telefono numeris rodomas tik prisijungusiems naudotojams.",
            "Žinutės, kurias siunčiate pagalbai ir pokalbyje internetu.",
            "Mokamo skelbimo mokėjimo būsena. Kortelės ir banko duomenys įvedami mokėjimų paslaugų teikėjo (Paysera) puslapyje ir Wheelio jų negauna.",
            "Jei prisijungiate per Google: Google el. pašto adresas ir vardas.",
            "Pranešimai apie neteisėtą turinį: pranešėjo vardas, el. pašto adresas, tekstas ir mūsų sprendimas. Moderavimo sprendimai dėl jūsų skelbimų ar paskyros.",
            "Techniniai duomenys: IP adresas ir naršyklės informacija saugumo žurnaluose, užklausų ribojimuose ir klaidų ataskaitose.",
          ],
        },
        {
          title: "2. Kodėl tvarkome ir kokiu teisiniu pagrindu",
          items: [
            "Kad sukurtume ir tvarkytume jūsų paskyrą bei skelbtume skelbimus: sutarties vykdymas (BDAR 6 str. 1 d. b p.). Paskyrai sukurti būtini el. paštas, vardas ir slaptažodis, o skelbimui paskelbti – telefono numeris; be jų paslaugos suteikti negalime.",
            "Kad pirkėjai galėtų susisiekti su pardavėjais ir skelbime būtų rodomas pardavėjo vardas bei telefonas: sutarties vykdymas.",
            "Kad atsakytume į užklausas, užtikrintume svetainės saugumą ir užkirstume kelią sukčiavimui: teisėtas interesas (6 str. 1 d. f p.).",
            "Kad tvarkytume mokėjimų apskaitą: teisinė prievolė (6 str. 1 d. c p.).",
            "Kad nagrinėtume pranešimus apie neteisėtą turinį, pagrįstume moderavimo sprendimus ir atsakytume į institucijų prašymus: teisinė prievolė pagal ES Skaitmeninių paslaugų aktą.",
            "Jūsų duomenų nenaudojame reklamai ar profiliavimui ir jų neparduodame.",
          ],
        },
        {
          title: "3. Slapukai ir naršyklės saugykla",
          items: [
            "Naudojame tik svetainei veikti būtinus slapukus ir naršyklės saugyklą, todėl sutikimo juostos nereikia. Reklaminių, analitinių ar sekimo slapukų nenaudojame.",
            "wheelio_access (15 minučių) ir wheelio_refresh (30 dienų): išlaiko prisijungimą. XSRF-TOKEN (1 valanda): saugo formas nuo suklastotų užklausų. wheelio_known (180 dienų): įsimena naršyklę, kurioje prisijungėte, kad apsaugotų nuo slaptažodžių spėliojimo. wheelio_google_state (10 minučių): saugo prisijungimą per Google. wheelio_support_chat (30 dienų): susieja naršyklę su jūsų pokalbiu.",
            "Naršyklės saugykla (mums nesiunčiama): tema, kalba, pokalbis ir skelbimo juodraštis.",
          ],
        },
        {
          title: "4. Kas gauna duomenis",
          items: [
            "Hostinger (Lietuva): svetainės, duomenų bazės ir el. pašto priegloba.",
            "Paysera (Lietuva): mokėjimai už mokamą skelbimą.",
            "Google: tik jei prisijungiate per Google.",
            "Twilio (JAV): telefono numeris ir kodas, tik kai įjungtas telefono patvirtinimas SMS žinute.",
            "OpenAI (JAV): skelbimo nuotrauka, tik naudojant automatinį nuotraukų rūšiavimą, kad atpažintų, kas joje pavaizduota.",
            "NHTSA vPIC (JAV): kai pardavimo formoje iššifruojate VIN, jūsų naršyklė į šią viešą duomenų bazę siunčia tik VIN.",
            "Teismai, teisėsaugos ir kitos institucijos, tik kai to reikalauja teisės aktai.",
            "Pardavėjas niekada nemato, kas pranešė apie jo skelbimą.",
          ],
        },
        {
          title: "5. Perdavimas už ES ribų",
          items: [
            "Duomenų perdavimui Twilio, OpenAI ir Google JAV taikoma ES ir JAV duomenų privatumo sistema arba Europos Komisijos standartinės sutarčių sąlygos (BDAR 45–46 str.).",
          ],
        },
        {
          title: "6. Kiek laiko saugome",
          items: [
            "Paskyros duomenis ir skelbimus – kol egzistuoja paskyra. Ištrynus paskyrą, skelbimai uždaromi, o asmens duomenys ištrinami arba nuasmeninami.",
            "Pagalbos užklausas – nuasmeniname ištrynus paskyrą.",
            "Mokėjimų įrašus – tiek, kiek reikalauja Lietuvos apskaitos teisės aktai.",
            "Pranešimus apie neteisėtą turinį – pranešėjo vardas ir el. paštas ištrinami praėjus metams po sprendimo.",
            "Užklausų ribojimo įrašus su IP adresais – iki 2 dienų; duomenų bazės atsargines kopijas – 14 dienų.",
          ],
        },
        {
          title: "7. Automatizuotas tvarkymas",
          items: [
            "Automatiniai patikrinimai (pvz., nauja paskyra ar keliems pardavėjams naudojamas telefono numeris) tik pažymi skelbimą moderatoriui. Sprendimų, kurie jums sukeltų teisinių ar panašiai reikšmingų pasekmių, vien automatizuotomis priemonėmis nepriimame.",
          ],
        },
        {
          title: "8. Jūsų teisės",
          items: [
            "Turite teisę susipažinti su savo duomenimis, juos ištaisyti ir ištrinti, apriboti jų tvarkymą, gauti juos perkeliamu formatu ir nesutikti su tvarkymu, grindžiamu mūsų teisėtu interesu.",
            `Paskyrą galite ištrinti patys savo profilyje. Kitais klausimais rašykite ${SUPPORT_EMAIL}. Atsakome per vieną mėnesį.`,
            "Galite pateikti skundą Valstybinei duomenų apsaugos inspekcijai (L. Sapiegos g. 17, LT-10312 Vilnius, www.vdai.lrv.lt) arba savo šalies duomenų apsaugos institucijai.",
          ],
        },
        {
          title: "9. Saugumas, amžius ir pakeitimai",
          items: [
            "Naudojame šifruotą ryšį (HTTPS), slaptažodžius saugome tik kaip maišas, o darbuotojams suteikiame prieigą tik prie darbui reikalingų duomenų.",
            "Wheelio skirta 18 metų ir vyresniems asmenims.",
            "Šios politikos pakeitimus skelbiame šiame puslapyje su nauja data, o apie esminius pakeitimus registruotiems naudotojams pranešame el. paštu.",
          ],
        },
      ],
    },
    RU: {
      title: "Политика конфиденциальности",
      updated: "Обновлено: 6 октября 2026",
      intro: `Здесь описано, какие персональные данные обрабатывает wheelio.lt, зачем и какие права дают вам Общий регламент ЕС по защите данных (GDPR). Контролёр данных: ${operator || "оператор wheelio.lt, указанный на странице «Контакты и реквизиты»"}. По любым вопросам защиты данных пишите на ${SUPPORT_EMAIL}.`,
      sections: [
        {
          title: "1. Какие данные мы обрабатываем",
          items: [
            "Данные аккаунта: e-mail, имя и фамилия, город, адрес, почтовый индекс, номер телефона и пароль (хранится только в виде хеша).",
            "Объявления: данные автомобиля, код декларации владельца (SDK), фотографии (при загрузке удаляются геоданные и данные камеры), цена, город и описание.",
            "Публично в объявлении видны: данные автомобиля, фото, цена, город и имя из вашего аккаунта как продавца. Номер телефона видят только вошедшие пользователи.",
            "Сообщения, которые вы отправляете в поддержку и онлайн-чат.",
            "Статус оплаты платной публикации. Данные карты и банка вводятся на стороне платёжного провайдера (Paysera) и к Wheelio не попадают.",
            "При входе через Google: ваш e-mail и имя в Google.",
            "Жалобы на незаконный контент: имя, e-mail и текст заявителя, а также наше решение. Решения модерации по вашим объявлениям или аккаунту.",
            "Технические данные: IP-адрес и данные браузера в журналах безопасности, ограничениях запросов и отчётах об ошибках.",
          ],
        },
        {
          title: "2. Зачем мы их обрабатываем и на каком основании",
          items: [
            "Чтобы создать и вести ваш аккаунт и публиковать объявления: исполнение договора (ст. 6(1)(b) GDPR). Для аккаунта нужны e-mail, имя и пароль, для публикации объявления — номер телефона; без них мы не можем оказать услугу.",
            "Чтобы покупатели могли связаться с продавцом и в объявлении были видны имя и телефон продавца: исполнение договора.",
            "Чтобы отвечать на обращения, обеспечивать безопасность сайта и предотвращать мошенничество: наш законный интерес (ст. 6(1)(f)).",
            "Чтобы вести учёт платежей: требование закона (ст. 6(1)(c)).",
            "Чтобы рассматривать жалобы на незаконный контент, обосновывать решения модерации и отвечать на запросы органов власти: требование Акта ЕС о цифровых услугах.",
            "Мы не используем ваши данные для рекламы или профилирования и не продаём их.",
          ],
        },
        {
          title: "3. Cookies и хранилище браузера",
          items: [
            "Мы используем только cookies и хранилище браузера, необходимые для работы сайта, поэтому баннер согласия не нужен. Рекламных, аналитических и отслеживающих cookies нет.",
            "wheelio_access (15 минут) и wheelio_refresh (30 дней): сохраняют вход. XSRF-TOKEN (1 час): защищает формы от поддельных запросов. wheelio_known (180 дней): запоминает браузер, где вы входили, для защиты от подбора пароля. wheelio_google_state (10 минут): защищает вход через Google. wheelio_support_chat (30 дней): связывает браузер с вашим чатом.",
            "Хранилище браузера (нам не передаётся): тема, язык, чат и черновик объявления.",
          ],
        },
        {
          title: "4. Кто получает данные",
          items: [
            "Hostinger (Литва): хостинг сайта, базы данных и почты.",
            "Paysera (Литва): оплата платной публикации.",
            "Google: только при входе через Google.",
            "Twilio (США): номер телефона и код, только когда включено подтверждение телефона по SMS.",
            "OpenAI (США): фото объявления, только при автоматической сортировке фото, чтобы распознать, что на нём.",
            "NHTSA vPIC (США): когда вы расшифровываете VIN в форме продажи, ваш браузер отправляет в эту публичную базу только VIN.",
            "Суды, правоохранительные и другие органы, только когда этого требует закон.",
            "Продавец никогда не видит, кто пожаловался на его объявление.",
          ],
        },
        {
          title: "5. Передача за пределы ЕС",
          items: [
            "Передача данных Twilio, OpenAI и Google в США защищена рамочной программой ЕС–США о конфиденциальности данных или стандартными договорными условиями Европейской комиссии (ст. 45–46 GDPR).",
          ],
        },
        {
          title: "6. Сколько мы храним данные",
          items: [
            "Данные аккаунта и объявления: пока существует аккаунт. После удаления аккаунта объявления закрываются, а персональные данные удаляются или обезличиваются.",
            "Обращения в поддержку: обезличиваются при удалении аккаунта.",
            "Платёжные записи: столько, сколько требует бухгалтерское законодательство Литвы.",
            "Жалобы на незаконный контент: имя и e-mail заявителя удаляются через год после решения.",
            "Записи ограничения запросов с IP-адресами: до 2 дней; резервные копии базы: 14 дней.",
          ],
        },
        {
          title: "7. Автоматизированная обработка",
          items: [
            "Автоматические проверки (например, новый аккаунт или телефон у нескольких продавцов) лишь отмечают объявление для модератора. Решений, влекущих для вас юридические или сходные значимые последствия, только автоматически мы не принимаем.",
          ],
        },
        {
          title: "8. Ваши права",
          items: [
            "Вы вправе получить доступ к своим данным, исправить и удалить их, ограничить обработку, получить их в переносимом формате и возразить против обработки на основании нашего законного интереса.",
            `Аккаунт можно удалить самостоятельно в профиле. По остальным вопросам пишите на ${SUPPORT_EMAIL}. Мы отвечаем в течение месяца.`,
            "Вы можете подать жалобу в Государственную инспекцию по защите данных Литвы (Valstybinė duomenų apsaugos inspekcija, L. Sapiegos g. 17, LT-10312 Vilnius, www.vdai.lrv.lt) или в орган по защите данных своей страны.",
          ],
        },
        {
          title: "9. Безопасность, возраст и изменения",
          items: [
            "Мы используем шифрованное соединение (HTTPS), храним пароли только в виде хешей и даём сотрудникам доступ только к данным, нужным для работы.",
            "Wheelio предназначен для лиц от 18 лет.",
            "Изменения политики мы публикуем на этой странице с новой датой, а о существенных изменениях сообщаем зарегистрированным пользователям по e-mail.",
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
