"use client";

import { useLanguage } from "@/context/LanguageContext";
import { InfoArticle, InfoList, InfoSection } from "@/components/info/InfoArticle";

type RuleSection = {
  title: string;
  items: string[];
};

export default function RulesPage() {
  const { language } = useLanguage();

  const copy = {
    EN: {
      title: "Rules",
      subtitle:
        "These rules help keep Wheelio safe, transparent and convenient for buyers and sellers.",
      updated: "Last updated: 6 October 2026",
      introTitle: "General principles",
      intro:
        "By using Wheelio, creating an account, publishing a listing or contacting another user, you agree to follow these rules. Wheelio may remove content, restrict features or suspend accounts that violate them. The service is provided by the operator named on the Contacts page. When you create an account you accept these rules as the agreement between you and Wheelio; the privacy policy explains how we handle personal data.",
      sections: [
        {
          title: "1. Accounts and identity",
          items: [
            "Provide accurate registration and contact information.",
            "One person should not create multiple accounts to avoid restrictions, bans or payment obligations.",
            "Do not share your password or verification codes with other people.",
            "You must be at least 18 years old to create an account and publish listings.",
            "A phone number is required to publish a listing. Wheelio may ask you to confirm it with a code sent by SMS.",
            "You can delete your account at any time in your profile. Your listings are then closed and your personal data is deleted or anonymised as described in the privacy policy.",
            "You are responsible for activity performed through your account until you report unauthorized access.",
          ],
        },
        {
          title: "2. Vehicle listings",
          items: [
            "Listings must describe a real vehicle that the seller is authorized to sell.",
            "Vehicle make, model, year, mileage, price, VIN-related data and other important information must be as accurate as reasonably possible.",
            "A listing for a car registered in Lithuania must include the owner declaration code (SDK) from Regitra, as Lithuanian law requires, so buyers can check the car in eRegitra.",
            "Do not intentionally hide major defects, accident damage, legal restrictions, outstanding finance or other information that could materially affect a buyer's decision.",
            "The same vehicle must not be posted repeatedly to manipulate search results.",
            "Listings for stolen vehicles, vehicles with falsified identification, illegal goods or fraudulent offers are prohibited.",
          ],
        },
        {
          title: "3. Photos and media",
          items: [
            "Upload photos of the actual vehicle whenever possible.",
            "Do not use misleading photos, stolen images, unrelated stock images or images that intentionally conceal the vehicle's condition.",
            "Do not upload illegal, offensive or privacy-invasive content.",
            "Wheelio may automatically analyze uploaded photos to classify vehicle views such as front, rear, side, interior, dashboard or VIN plate.",
            "Automatic image classification may be incorrect, so the seller remains responsible for checking and correcting the selected photo category.",
          ],
        },
        {
          title: "4. Price and paid publication",
          items: [
            "The seller is responsible for entering the correct vehicle price.",
            "A publication fee may apply before a listing becomes publicly visible.",
            "A paid listing becomes active only after the payment provider confirms successful payment.",
            "If payment is cancelled, rejected or not confirmed, the listing may remain in draft or pending-payment status.",
            "Publication fees cover the listing service and do not guarantee that the vehicle will be sold.",
            "The publication price is shown in euro, as a final price with all taxes, before you pay.",
            "If you are a consumer, you have a 14-day right to withdraw from the paid publication service. Because a listing is published right after payment, before paying you ask us to start at once and confirm that you lose the right of withdrawal once the listing is published. If you withdraw before publication, we refund the full amount within 14 days.",
            "If a paid listing is rejected by moderation before it is ever published, the fee is refunded. A listing removed later for breaking these rules is not refunded.",
            "A payment receipt or invoice is available on request at the support e-mail.",
          ],
        },
        {
          title: "5. Communication between users",
          items: [
            "Communicate respectfully and only for legitimate vehicle-related purposes.",
            "Spam, harassment, threats, discrimination, scams and attempts to obtain passwords or verification codes are prohibited.",
            "Do not send malicious links, malware or deceptive payment requests.",
            "Never send a verification code received by SMS or phone call to another person.",
            "Wheelio may restrict messaging or accounts where abuse or fraud is suspected.",
          ],
        },
        {
          title: "6. Buying safely",
          items: [
            "Inspect the vehicle and its documents before completing a purchase.",
            "Verify VIN, ownership, registration documents and any available service history.",
            "Do not rely only on information automatically decoded from a VIN or generated by automated tools.",
            "Avoid sending large advance payments to unknown sellers without appropriate verification.",
            "Where appropriate, use a written purchase agreement and keep payment records.",
          ],
        },
        {
          title: "7. Prohibited activity",
          items: [
            "Fraud, impersonation, phishing and identity theft are prohibited.",
            "Manipulating reviews, listings, prices, payment flows or platform functionality is prohibited.",
            "Attempting to bypass security, access another user's data, scrape protected data or interfere with Wheelio infrastructure is prohibited.",
            "Using Wheelio for unlawful transactions, money laundering or other illegal purposes is prohibited.",
            "Automated bulk activity may be restricted unless explicitly authorized by Wheelio.",
          ],
        },
        {
          title: "8. Support and reports",
          items: [
            "Users can contact support through the Help page or the live support widget.",
            "When reporting a problem, provide enough information for the support team to investigate it.",
            "Do not knowingly submit false reports or abuse the support system.",
            "Wheelio may retain support conversations where necessary to resolve disputes, prevent abuse or improve service quality.",
            "Anyone, with or without an account, can report illegal content through the form at wheelio.lt/report or the link on each listing. We confirm receipt, a person reviews the report, and we tell the reporter the decision (EU Digital Services Act, Art. 16).",
          ],
        },
        {
          title: "9. Automated tools and external services",
          items: [
            "Wheelio may use third-party services for VIN decoding, image analysis, payments, login, SMS and phone verification.",
            "Data returned by external services may be incomplete or inaccurate and should not be treated as an official vehicle inspection.",
            "The seller remains responsible for checking automatically filled vehicle information before publishing.",
            "Availability of third-party services may temporarily affect selected Wheelio features.",
          ],
        },
        {
          title: "10. Moderation and enforcement",
          items: [
            "Wheelio may edit visibility, reject, pause or remove listings that violate these rules or appear fraudulent.",
            "Accounts may be warned, temporarily restricted or suspended depending on the seriousness or repetition of a violation.",
            "Where legally required, Wheelio may cooperate with competent authorities.",
            "Users may contact support if they believe a moderation decision was made in error.",
            "New listings may be checked by a moderator before they are published. Automatic signals only flag a listing for review; decisions are taken by a person.",
            "When a listing is rejected or removed, or an account is suspended, the user receives a statement of reasons by e-mail: what was restricted, the facts, the rule or law relied on, and how to contest it. The decision can be contested by replying within 6 months, before a certified out-of-court dispute settlement body or in court. More at wheelio.lt/dsa.",
          ],
        },
        {
          title: "11. Responsibility",
          items: [
            "Wheelio provides a platform that connects buyers and sellers and is not automatically a party to the vehicle sale contract.",
            "Buyers and sellers are responsible for their own negotiations, inspections, agreements, taxes and legal obligations.",
            "Wheelio does not guarantee the condition, ownership, legality or accuracy of every vehicle listing.",
            "Wheelio stores listings at the request of sellers and does not check every listing before it is published. When we learn that a listing is illegal, we act quickly to remove it.",
            "Wheelio is liable for its own service under applicable law. Liability for damage caused intentionally or through gross negligence, and for harm to life or health, is never excluded.",
            "Nothing in these rules limits rights that users have under mandatory consumer or other applicable law.",
          ],
        },
        {
          title: "12. Changes to the rules",
          items: [
            "These rules may be updated when Wheelio features, legal requirements or safety practices change.",
            "The current version is published on this page with its date.",
            "We tell registered users about significant changes by e-mail at least 15 days before they take effect. If you do not agree, you can delete your account before that date at no cost; otherwise the new version applies from that date.",
          ],
        },
        {
          title: "13. Search order and who you buy from",
          items: [
            "Search results are ordered by the sorting the user chooses (newest, oldest, price, mileage or year). By default the newest listings come first. Nobody can pay for a higher position.",
            "Sellers on Wheelio can be private persons or businesses. When you buy from a private person, EU consumer protection law (for example, the 14-day right of withdrawal and the legal guarantee) does not apply to that sale.",
            "Businesses (car dealers) must publish listings only in their own name and must comply with consumer protection law, including the price shown with all taxes.",
          ],
        },
        {
          title: "14. Your content",
          items: [
            "You keep the rights to the texts and photos you publish. You may publish only content you created or are allowed to use.",
            "While your listing is on Wheelio, you allow Wheelio, free of charge, to store, show, resize and crop it on the site and in search engine previews, only to provide the service. This permission ends when the listing is closed or deleted.",
            "The Wheelio name, logo and site design belong to Wheelio. Copying listings or other site content in bulk is not allowed without our written permission.",
          ],
        },
        {
          title: "15. Ending the agreement",
          items: [
            "You can stop using Wheelio and delete your account at any time.",
            "We may suspend or close an account that seriously or repeatedly breaks these rules or the law, and we explain why in a statement of reasons. For business users we give at least 30 days' notice before closing an account for good, unless the law requires otherwise or the account was used for fraud or other serious or repeated breaches.",
          ],
        },
        {
          title: "16. Applicable law and disputes",
          items: [
            "These rules are governed by the law of the Republic of Lithuania. If you are a consumer, you also keep the protection of the mandatory law of the country where you live.",
            "Please write to support first; we answer complaints within 14 days.",
            "Consumers can refer an unresolved dispute out of court to the State Consumer Rights Protection Authority (Valstybinė vartotojų teisių apsaugos tarnyba, Vilniaus g. 25, LT-01402 Vilnius, www.vvtat.lt). Disputes about moderation decisions can also go to a certified out-of-court dispute settlement body (see wheelio.lt/dsa).",
            "Otherwise disputes are decided by the courts of the Republic of Lithuania. A consumer may always bring a claim in the courts of the place where they live.",
          ],
        },
      ] as RuleSection[],
      footer:
        "If you are unsure whether a listing or action is allowed, contact Wheelio support before proceeding.",
    },

    LT: {
      title: "Taisyklės",
      subtitle:
        "Šios taisyklės padeda išlaikyti Wheelio saugią, skaidrią ir patogią pirkėjams bei pardavėjams.",
      updated: "Paskutinį kartą atnaujinta: 2026 m. spalio 6 d.",
      introTitle: "Bendrieji principai",
      intro:
        "Naudodamiesi Wheelio, kurdami paskyrą, skelbdami skelbimą ar susisiekdami su kitu naudotoju sutinkate laikytis šių taisyklių. Wheelio gali pašalinti turinį, apriboti funkcijas arba sustabdyti paskyras, kurios pažeidžia taisykles. Paslaugą teikia valdytojas, nurodytas puslapyje „Kontaktai ir rekvizitai“. Kurdami paskyrą jūs sutinkate su šiomis taisyklėmis kaip su sutartimi tarp jūsų ir Wheelio; kaip tvarkome asmens duomenis, paaiškinta privatumo politikoje.",
      sections: [
        {
          title: "1. Paskyros ir tapatybė",
          items: [
            "Registracijos ir kontaktiniai duomenys turi būti teisingi ir aktualūs.",
            "Negalima kurti kelių paskyrų siekiant apeiti apribojimus, blokavimus ar mokėjimo prievoles.",
            "Nesidalykite slaptažodžiu ar patvirtinimo kodais su kitais asmenimis.",
            "Paskyrą kurti ir skelbimus skelbti gali tik asmenys, kuriems yra bent 18 metų.",
            "Norint paskelbti skelbimą, reikia nurodyti telefono numerį. Wheelio gali paprašyti jį patvirtinti SMS žinute atsiųstu kodu.",
            "Paskyrą galite bet kada ištrinti savo profilyje. Tada jūsų skelbimai uždaromi, o asmens duomenys ištrinami arba nuasmeninami, kaip aprašyta privatumo politikoje.",
            "Naudotojas atsako už veiksmus savo paskyroje tol, kol praneša apie neteisėtą prieigą.",
          ],
        },
        {
          title: "2. Automobilių skelbimai",
          items: [
            "Skelbime turi būti aprašomas realus automobilis, kurį pardavėjas turi teisę parduoti.",
            "Markė, modelis, metai, rida, kaina, su VIN susiję duomenys ir kita svarbi informacija turi būti kiek įmanoma tikslesnė.",
            "Lietuvoje registruoto automobilio skelbime privaloma nurodyti Regitros savininko deklaravimo kodą (SDK), kaip reikalauja Lietuvos teisės aktai, kad pirkėjas galėtų patikrinti automobilį eRegitroje.",
            "Negalima sąmoningai slėpti rimtų defektų, avarijų žalos, teisinių apribojimų, finansinių įsipareigojimų ar kitos pirkėjo sprendimui svarbios informacijos.",
            "Negalima pakartotinai skelbti to paties automobilio siekiant dirbtinai pagerinti jo poziciją paieškoje.",
            "Draudžiami vogtų automobilių, suklastotos tapatybės transporto priemonių, neteisėtų prekių ar apgaulingų pasiūlymų skelbimai.",
          ],
        },
        {
          title: "3. Nuotraukos ir kita medžiaga",
          items: [
            "Kai įmanoma, kelkite tikro parduodamo automobilio nuotraukas.",
            "Negalima naudoti klaidinančių, pavogtų, nesusijusių nuotraukų ar vaizdų, kurie sąmoningai slepia automobilio būklę.",
            "Draudžiamas neteisėtas, įžeidžiantis ar kitų asmenų privatumą pažeidžiantis turinys.",
            "Wheelio gali automatiškai analizuoti nuotraukas ir nustatyti vaizdo tipą: priekį, galą, šoną, saloną, prietaisų skydelį ar VIN lentelę.",
            "Automatinis nuotraukų atpažinimas gali suklysti, todėl pardavėjas privalo patikrinti ir, jei reikia, pataisyti kategoriją.",
          ],
        },
        {
          title: "4. Kaina ir mokamas skelbimo paskelbimas",
          items: [
            "Pardavėjas atsako už teisingai nurodytą automobilio kainą.",
            "Prieš viešai paskelbiant skelbimą gali būti taikomas paskelbimo mokestis.",
            "Mokamas skelbimas tampa aktyvus tik tada, kai mokėjimo paslaugų teikėjas patvirtina sėkmingą mokėjimą.",
            "Jei mokėjimas atšaukiamas, atmetamas ar nepatvirtinamas, skelbimas gali likti juodraščio arba laukiančio mokėjimo būsenoje.",
            "Paskelbimo mokestis mokamas už skelbimo paslaugą ir negarantuoja automobilio pardavimo.",
            "Paskelbimo kaina prieš mokant nurodoma eurais kaip galutinė kaina su visais mokesčiais.",
            "Jei esate vartotojas, turite 14 dienų teisę atsisakyti mokamos paskelbimo paslaugos. Kadangi skelbimas paskelbiamas iškart po apmokėjimo, prieš mokėdami jūs paprašote paslaugą pradėti teikti nedelsiant ir patvirtinate, kad paskelbus skelbimą netenkate teisės atsisakyti sutarties. Jei atsisakote iki paskelbimo, visą sumą grąžiname per 14 dienų.",
            "Jei apmokėtas skelbimas atmetamas moderuojant dar prieš jį paskelbiant, mokestis grąžinamas. Už vėliau dėl taisyklių pažeidimo pašalintą skelbimą pinigai negrąžinami.",
            "Mokėjimo kvitą ar sąskaitą faktūrą galite gauti paprašę pagalbos el. paštu.",
          ],
        },
        {
          title: "5. Naudotojų bendravimas",
          items: [
            "Bendraukite pagarbiai ir tik teisėtais su automobiliu susijusiais tikslais.",
            "Draudžiami šlamštas, priekabiavimas, grasinimai, diskriminacija, sukčiavimas ir bandymai išgauti slaptažodžius ar patvirtinimo kodus.",
            "Negalima siųsti kenkėjiškų nuorodų, programų ar klaidinančių mokėjimo prašymų.",
            "Niekada neperduokite kitam asmeniui SMS ar skambučiu gauto patvirtinimo kodo.",
            "Wheelio gali apriboti bendravimo funkcijas ar paskyrą, jei įtariamas piktnaudžiavimas arba sukčiavimas.",
          ],
        },
        {
          title: "6. Saugus automobilio pirkimas",
          items: [
            "Prieš pirkdami apžiūrėkite automobilį ir jo dokumentus.",
            "Patikrinkite VIN, nuosavybės duomenis, registracijos dokumentus ir, jei įmanoma, serviso istoriją.",
            "Nepasikliaukite vien tik automatiškai pagal VIN užpildytais ar kitų automatinių įrankių sugeneruotais duomenimis.",
            "Venkite didelių avansinių mokėjimų nepažįstamiems pardavėjams be tinkamo patikrinimo.",
            "Kai tikslinga, sudarykite rašytinę pirkimo–pardavimo sutartį ir saugokite mokėjimo įrodymus.",
          ],
        },
        {
          title: "7. Draudžiama veikla",
          items: [
            "Draudžiami sukčiavimas, apsimetimas kitu asmeniu, duomenų viliojimas ir tapatybės vagystė.",
            "Draudžiama manipuliuoti skelbimais, kainomis, mokėjimais ar platformos veikimu.",
            "Draudžiama bandyti apeiti saugumo sistemas, pasiekti kitų naudotojų duomenis, rinkti apsaugotus duomenis automatizuotai ar trikdyti Wheelio infrastruktūrą.",
            "Draudžiama naudoti Wheelio neteisėtiems sandoriams, pinigų plovimui ar kitai neteisėtai veiklai.",
            "Masinė automatizuota veikla gali būti ribojama, jei Wheelio jos aiškiai nepatvirtino.",
          ],
        },
        {
          title: "8. Pagalba ir pranešimai",
          items: [
            "Naudotojai gali kreiptis per Pagalbos puslapį arba tiesioginio pokalbio langą.",
            "Pranešdami apie problemą pateikite pakankamai informacijos, kad pagalbos komanda galėtų ją ištirti.",
            "Draudžiama sąmoningai teikti melagingus pranešimus ar piktnaudžiauti pagalbos sistema.",
            "Wheelio gali saugoti pagalbos pokalbius, kai tai būtina ginčams spręsti, piktnaudžiavimui užkirsti ar paslaugų kokybei gerinti.",
            "Bet kas, turintis paskyrą ar ne, gali pranešti apie neteisėtą turinį forma wheelio.lt/report arba nuoroda kiekviename skelbime. Gavimą patvirtiname, pranešimą peržiūri žmogus, o apie sprendimą informuojame pranešėją (Skaitmeninių paslaugų akto 16 str.).",
          ],
        },
        {
          title: "9. Automatiniai įrankiai ir išorinės paslaugos",
          items: [
            "Wheelio gali naudoti trečiųjų šalių paslaugas VIN dekodavimui, vaizdų analizei, mokėjimams, prisijungimui, SMS ir telefono patvirtinimui.",
            "Išorinių paslaugų pateikti duomenys gali būti neišsamūs ar netikslūs ir nėra oficiali automobilio techninė apžiūra.",
            "Prieš paskelbdamas skelbimą pardavėjas privalo patikrinti automatiškai užpildytą automobilio informaciją.",
            "Trečiųjų šalių paslaugų sutrikimai gali laikinai paveikti kai kurias Wheelio funkcijas.",
          ],
        },
        {
          title: "10. Moderavimas ir taisyklių vykdymas",
          items: [
            "Wheelio gali apriboti matomumą, atmesti, sustabdyti arba pašalinti taisykles pažeidžiančius ar įtartinus skelbimus.",
            "Priklausomai nuo pažeidimo rimtumo ir pasikartojimo paskyrai gali būti skirtas įspėjimas, laikinas apribojimas arba blokavimas.",
            "Kai to reikalauja teisės aktai, Wheelio gali bendradarbiauti su kompetentingomis institucijomis.",
            "Jei naudotojas mano, kad moderavimo sprendimas priimtas klaidingai, jis gali kreiptis į pagalbą.",
            "Nauji skelbimai prieš paskelbiant gali būti tikrinami moderatoriaus. Automatiniai signalai tik pažymi skelbimą peržiūrai; sprendimus priima žmogus.",
            "Atmetus ar pašalinus skelbimą arba užblokavus paskyrą, naudotojas el. paštu gauna motyvuotą sprendimą: kas apribota, faktai, taisyklė ar teisės aktas ir kaip ginčyti. Sprendimą galima ginčyti atsakius per 6 mėnesius, sertifikuotoje neteisminio ginčų sprendimo institucijoje arba teisme. Daugiau: wheelio.lt/dsa.",
          ],
        },
        {
          title: "11. Atsakomybė",
          items: [
            "Wheelio suteikia platformą pirkėjams ir pardavėjams susisiekti ir savaime nėra automobilio pirkimo–pardavimo sutarties šalis.",
            "Pirkėjai ir pardavėjai patys atsako už derybas, automobilio patikrą, sutartis, mokesčius ir kitus teisinius įsipareigojimus.",
            "Wheelio negarantuoja kiekvieno skelbimo automobilio būklės, nuosavybės, teisėtumo ar visų pateiktų duomenų tikslumo.",
            "Wheelio saugo skelbimus pardavėjų prašymu ir netikrina kiekvieno skelbimo prieš jį paskelbiant. Sužinoję, kad skelbimas neteisėtas, nedelsdami jį pašaliname.",
            "Wheelio atsako už savo paslaugą pagal taikomus teisės aktus. Atsakomybė už tyčia ar dėl didelio neatsargumo padarytą žalą ir už žalą gyvybei ar sveikatai niekada neribojama.",
            "Šios taisyklės neriboja privalomų naudotojų teisių, kurias suteikia vartotojų apsaugos ar kiti taikomi teisės aktai.",
          ],
        },
        {
          title: "12. Taisyklių pakeitimai",
          items: [
            "Taisyklės gali būti atnaujinamos keičiantis Wheelio funkcijoms, teisės aktams ar saugumo praktikai.",
            "Aktuali taisyklių versija su data skelbiama šiame puslapyje.",
            "Apie esminius pakeitimus registruotiems naudotojams pranešame el. paštu ne vėliau kaip prieš 15 dienų iki jų įsigaliojimo. Jei nesutinkate, iki tos dienos galite nemokamai ištrinti paskyrą; priešingu atveju nauja versija taikoma nuo tos dienos.",
          ],
        },
        {
          title: "13. Paieškos rezultatų tvarka ir iš ko perkate",
          items: [
            "Paieškos rezultatai rikiuojami pagal naudotojo pasirinktą tvarką (naujausi, seniausi, kaina, rida ar metai). Numatytuoju atveju pirmiausia rodomi naujausi skelbimai. Aukštesnės vietos nupirkti negalima.",
            "Wheelio pardavėjai gali būti privatūs asmenys arba įmonės. Perkant iš privataus asmens, ES vartotojų apsaugos teisė (pvz. 14 dienų teisė atsisakyti sutarties ir teisinė garantija) šiam pirkimui netaikoma.",
            "Įmonės (automobilių prekeiviai) skelbimus turi teikti tik savo vardu ir laikytis vartotojų teisių apsaugos teisės aktų, įskaitant kainos nurodymą su visais mokesčiais.",
          ],
        },
        {
          title: "14. Jūsų turinys",
          items: [
            "Teisės į jūsų skelbiamus tekstus ir nuotraukas lieka jums. Skelbti galite tik savo sukurtą turinį arba turinį, kurį turite teisę naudoti.",
            "Kol jūsų skelbimas yra Wheelio, leidžiate Wheelio neatlygintinai jį saugoti, rodyti, mažinti ir apkarpyti svetainėje bei paieškos sistemų peržiūrose, tik tam, kad būtų teikiama paslauga. Šis leidimas baigiasi uždarius ar ištrynus skelbimą.",
            "Wheelio pavadinimas, logotipas ir svetainės dizainas priklauso Wheelio. Masiškai kopijuoti skelbimus ar kitą svetainės turinį be mūsų rašytinio leidimo draudžiama.",
          ],
        },
        {
          title: "15. Sutarties pabaiga",
          items: [
            "Galite bet kada nustoti naudotis Wheelio ir ištrinti paskyrą.",
            "Galime sustabdyti ar uždaryti paskyrą, kuri šiurkščiai ar pakartotinai pažeidžia šias taisykles ar teisės aktus, ir paaiškiname priežastis motyvuotame sprendime. Verslo naudotojams apie galutinį paskyros uždarymą pranešame ne vėliau kaip prieš 30 dienų, nebent kitaip reikalauja teisės aktai arba paskyra buvo naudojama sukčiavimui ar kitiems šiurkštiems ar pakartotiniams pažeidimams.",
          ],
        },
        {
          title: "16. Taikoma teisė ir ginčai",
          items: [
            "Šioms taisyklėms taikoma Lietuvos Respublikos teisė. Jei esate vartotojas, jums taip pat taikoma jūsų gyvenamosios šalies privalomųjų teisės normų apsauga.",
            "Pirmiausia parašykite pagalbai; į skundus atsakome per 14 dienų.",
            "Vartotojai neišspręstą ginčą ne teismo tvarka gali perduoti Valstybinei vartotojų teisių apsaugos tarnybai (Vilniaus g. 25, LT-01402 Vilnius, www.vvtat.lt). Ginčus dėl moderavimo sprendimų taip pat galima spręsti sertifikuotoje neteisminio ginčų sprendimo įstaigoje (žr. wheelio.lt/dsa).",
            "Kitais atvejais ginčus sprendžia Lietuvos Respublikos teismai. Vartotojas visada gali kreiptis į savo gyvenamosios vietos teismą.",
          ],
        },
      ] as RuleSection[],
      footer:
        "Jei abejojate, ar konkretus skelbimas ar veiksmas yra leidžiamas, prieš tęsdami kreipkitės į Wheelio pagalbą.",
    },

    RU: {
      title: "Правила",
      subtitle:
        "Эти правила помогают сделать Wheelio безопасной, прозрачной и удобной площадкой для покупателей и продавцов.",
      updated: "Последнее обновление: 6 октября 2026 г.",
      introTitle: "Общие принципы",
      intro:
        "Используя Wheelio, создавая аккаунт, публикуя объявление или связываясь с другим пользователем, вы соглашаетесь соблюдать эти правила. Wheelio может удалить контент, ограничить функции или приостановить аккаунты, нарушающие правила. Услугу предоставляет оператор, указанный на странице «Контакты и реквизиты». Создавая аккаунт, вы принимаете эти правила как договор между вами и Wheelio; как мы обрабатываем персональные данные, описано в политике конфиденциальности.",
      sections: [
        {
          title: "1. Аккаунты и личные данные",
          items: [
            "Указывайте корректные и актуальные регистрационные и контактные данные.",
            "Нельзя создавать несколько аккаунтов для обхода ограничений, блокировок или обязательств по оплате.",
            "Не передавайте пароль или коды подтверждения другим людям.",
            "Создавать аккаунт и публиковать объявления можно только с 18 лет.",
            "Для публикации объявления нужен номер телефона. Wheelio может попросить подтвердить его кодом из SMS.",
            "Аккаунт можно удалить в любой момент в профиле. Тогда ваши объявления закрываются, а персональные данные удаляются или обезличиваются, как описано в политике конфиденциальности.",
            "Пользователь отвечает за действия через свой аккаунт до момента сообщения о несанкционированном доступе.",
          ],
        },
        {
          title: "2. Объявления об автомобилях",
          items: [
            "В объявлении должен быть указан реальный автомобиль, который продавец имеет право продавать.",
            "Марка, модель, год, пробег, цена, VIN-данные и другая важная информация должны быть максимально точными.",
            "В объявлении об автомобиле, зарегистрированном в Литве, нужно указать код декларации владельца (SDK) из Regitra, как требует закон Литвы, чтобы покупатель мог проверить машину в eRegitra.",
            "Запрещено намеренно скрывать серьёзные дефекты, последствия ДТП, юридические ограничения, финансовые обязательства и другую информацию, существенно влияющую на решение покупателя.",
            "Нельзя многократно публиковать один и тот же автомобиль для искусственного продвижения в поиске.",
            "Запрещены объявления об украденных автомобилях, автомобилях с поддельными идентификаторами, незаконных товарах и мошеннических предложениях.",
          ],
        },
        {
          title: "3. Фотографии и медиа",
          items: [
            "По возможности загружайте фотографии именно продаваемого автомобиля.",
            "Нельзя использовать вводящие в заблуждение, украденные, нерелевантные стоковые фотографии или изображения, скрывающие реальное состояние автомобиля.",
            "Запрещён незаконный, оскорбительный или нарушающий чужую приватность контент.",
            "Wheelio может автоматически анализировать фотографии и определять ракурс: перед, зад, бок, салон, приборная панель или VIN-табличка.",
            "Автоматическая классификация может ошибаться, поэтому продавец обязан проверить и при необходимости исправить категорию фотографии.",
          ],
        },
        {
          title: "4. Цена и платная публикация",
          items: [
            "Продавец несёт ответственность за правильность указанной цены автомобиля.",
            "Перед публичной публикацией объявления может взиматься плата за размещение.",
            "Платное объявление становится активным только после подтверждения успешной оплаты платёжным провайдером.",
            "Если оплата отменена, отклонена или не подтверждена, объявление может остаться черновиком или в статусе ожидания оплаты.",
            "Оплата взимается за услугу публикации и не гарантирует продажу автомобиля.",
            "Цена публикации показывается до оплаты в евро как итоговая цена со всеми налогами.",
            "Если вы потребитель, у вас есть 14-дневное право отказаться от платной услуги публикации. Поскольку объявление публикуется сразу после оплаты, перед оплатой вы просите начать оказание услуги немедленно и подтверждаете, что после публикации теряете право на отказ. Если вы откажетесь до публикации, мы вернём всю сумму в течение 14 дней.",
            "Если оплаченное объявление отклонено модерацией до публикации, плата возвращается. За объявление, снятое позже за нарушение правил, деньги не возвращаются.",
            "Квитанцию или счёт об оплате можно получить по запросу на e-mail поддержки.",
          ],
        },
        {
          title: "5. Общение пользователей",
          items: [
            "Общайтесь уважительно и только по законным вопросам, связанным с автомобилями.",
            "Запрещены спам, преследование, угрозы, дискриминация, мошенничество и попытки получить чужие пароли или коды подтверждения.",
            "Нельзя отправлять вредоносные ссылки, программы или обманные запросы на оплату.",
            "Никогда не передавайте другому человеку код подтверждения, полученный по SMS или звонку.",
            "Wheelio может ограничить сообщения или аккаунт при подозрении на злоупотребление или мошенничество.",
          ],
        },
        {
          title: "6. Безопасная покупка",
          items: [
            "Перед покупкой осмотрите автомобиль и его документы.",
            "Проверьте VIN, право собственности, регистрационные документы и доступную сервисную историю.",
            "Не полагайтесь только на данные, автоматически полученные по VIN или другими автоматизированными инструментами.",
            "Избегайте крупных авансов неизвестным продавцам без надлежащей проверки.",
            "При необходимости заключайте письменный договор купли-продажи и сохраняйте подтверждения платежей.",
          ],
        },
        {
          title: "7. Запрещённая деятельность",
          items: [
            "Запрещены мошенничество, выдача себя за другого человека, фишинг и кража личности.",
            "Запрещены манипуляции объявлениями, ценами, оплатой или работой платформы.",
            "Запрещены попытки обхода защиты, получения доступа к чужим данным, массового сбора защищённой информации или вмешательства в инфраструктуру Wheelio.",
            "Запрещено использовать Wheelio для незаконных сделок, отмывания денег и другой противоправной деятельности.",
            "Массовая автоматизированная активность может быть ограничена без отдельного разрешения Wheelio.",
          ],
        },
        {
          title: "8. Поддержка и жалобы",
          items: [
            "Связаться с поддержкой можно через страницу «Помощь» или онлайн-чат.",
            "При обращении указывайте достаточно информации, чтобы команда могла разобраться в проблеме.",
            "Запрещено намеренно подавать ложные жалобы или злоупотреблять службой поддержки.",
            "Wheelio может хранить переписку с поддержкой, если это необходимо для разрешения споров, предотвращения злоупотреблений или улучшения качества сервиса.",
            "Любой, с аккаунтом или без, может сообщить о незаконном контенте через форму wheelio.lt/report или ссылку в каждом объявлении. Мы подтверждаем получение, жалобу рассматривает человек, и мы сообщаем заявителю решение (Акт ЕС о цифровых услугах, ст. 16).",
          ],
        },
        {
          title: "9. Автоматические инструменты и внешние сервисы",
          items: [
            "Wheelio может использовать сторонние сервисы для VIN-декодирования, анализа изображений, платежей, входа, SMS и телефонного подтверждения.",
            "Данные внешних сервисов могут быть неполными или неточными и не являются официальной технической экспертизой автомобиля.",
            "Перед публикацией продавец обязан проверить автоматически заполненные данные автомобиля.",
            "Недоступность сторонних сервисов может временно влиять на отдельные функции Wheelio.",
          ],
        },
        {
          title: "10. Модерация и меры",
          items: [
            "Wheelio может ограничить видимость, отклонить, приостановить или удалить объявления, нарушающие правила или вызывающие подозрения.",
            "В зависимости от серьёзности и повторяемости нарушения аккаунт может получить предупреждение, временное ограничение или блокировку.",
            "Когда это требуется законом, Wheelio может сотрудничать с компетентными органами.",
            "Если пользователь считает решение модерации ошибочным, он может обратиться в поддержку.",
            "Новые объявления могут проверяться модератором до публикации. Автоматические сигналы лишь отмечают объявление для проверки; решения принимает человек.",
            "При отклонении или снятии объявления либо блокировке аккаунта пользователь получает по e-mail мотивированное решение: что ограничено, факты, правило или закон и как обжаловать. Решение можно обжаловать, ответив в течение 6 месяцев, в сертифицированном органе внесудебного урегулирования споров или в суде. Подробнее: wheelio.lt/dsa.",
          ],
        },
        {
          title: "11. Ответственность",
          items: [
            "Wheelio предоставляет площадку для связи покупателей и продавцов и автоматически не становится стороной договора купли-продажи автомобиля.",
            "Покупатели и продавцы самостоятельно отвечают за переговоры, осмотр автомобиля, договоры, налоги и другие юридические обязательства.",
            "Wheelio не гарантирует состояние, право собственности, законность или точность всех данных каждого автомобиля.",
            "Wheelio хранит объявления по просьбе продавцов и не проверяет каждое объявление до публикации. Узнав, что объявление незаконно, мы оперативно его удаляем.",
            "Wheelio отвечает за свою услугу по применимому праву. Ответственность за вред, причинённый умышленно или по грубой неосторожности, а также за вред жизни или здоровью никогда не исключается.",
            "Эти правила не ограничивают обязательные права пользователей, предусмотренные законодательством о защите потребителей и иными применимыми нормами.",
          ],
        },
        {
          title: "12. Изменение правил",
          items: [
            "Правила могут обновляться при изменении функций Wheelio, законодательства или практик безопасности.",
            "Актуальная версия с датой публикуется на этой странице.",
            "О существенных изменениях мы сообщаем зарегистрированным пользователям по e-mail не позднее чем за 15 дней до их вступления в силу. Если вы не согласны, до этой даты можно бесплатно удалить аккаунт; иначе новая версия действует с этой даты.",
          ],
        },
        {
          title: "13. Порядок результатов поиска и у кого вы покупаете",
          items: [
            "Результаты поиска упорядочены по выбранной пользователем сортировке (новые, старые, цена, пробег или год). По умолчанию сначала новые объявления. Купить более высокое место нельзя.",
            "Продавцами на Wheelio могут быть частные лица или компании. При покупке у частного лица законы ЕС о защите потребителей (например, 14-дневное право отказа и законная гарантия) на эту сделку не распространяются.",
            "Компании (автодилеры) должны публиковать объявления только от своего имени и соблюдать законы о защите прав потребителей, включая указание цены со всеми налогами.",
          ],
        },
        {
          title: "14. Ваш контент",
          items: [
            "Права на тексты и фотографии, которые вы публикуете, остаются у вас. Публиковать можно только свой контент или контент, который вы вправе использовать.",
            "Пока объявление размещено на Wheelio, вы бесплатно разрешаете Wheelio хранить, показывать, уменьшать и обрезать его на сайте и в превью поисковых систем, только для оказания услуги. Разрешение прекращается, когда объявление закрыто или удалено.",
            "Название, логотип и дизайн сайта Wheelio принадлежат Wheelio. Массово копировать объявления или другой контент сайта без нашего письменного разрешения запрещено.",
          ],
        },
        {
          title: "15. Прекращение договора",
          items: [
            "Вы можете в любой момент перестать пользоваться Wheelio и удалить аккаунт.",
            "Мы можем приостановить или закрыть аккаунт, который грубо или повторно нарушает эти правила или закон, и объясняем причины в мотивированном решении. Бизнес-пользователей мы предупреждаем об окончательном закрытии аккаунта не менее чем за 30 дней, если закон не требует иного или аккаунт не использовался для мошенничества или других грубых либо повторных нарушений.",
          ],
        },
        {
          title: "16. Применимое право и споры",
          items: [
            "К этим правилам применяется право Литовской Республики. Если вы потребитель, за вами также сохраняется защита обязательных норм права страны вашего проживания.",
            "Сначала напишите в поддержку; на жалобы мы отвечаем в течение 14 дней.",
            "Потребители могут передать неурегулированный спор во внесудебном порядке в Государственную службу защиты прав потребителей (Valstybinė vartotojų teisių apsaugos tarnyba, Vilniaus g. 25, LT-01402 Vilnius, www.vvtat.lt). Споры о решениях модерации также можно передать в сертифицированный орган внесудебного урегулирования споров (см. wheelio.lt/dsa).",
            "В остальных случаях споры решают суды Литовской Республики. Потребитель всегда может обратиться в суд по месту своего жительства.",
          ],
        },
      ] as RuleSection[],
      footer:
        "Если вы не уверены, разрешено ли конкретное объявление или действие, обратитесь в поддержку Wheelio до его совершения.",
    },
  }[language];

  return (
    <InfoArticle
      title={copy.title}
      meta={copy.updated}
      intro={<p className="text-muted-foreground">{copy.subtitle}</p>}
    >
      <InfoSection title={copy.introTitle}>
        <p className="text-[15px] leading-7 text-foreground/90 md:text-base">{copy.intro}</p>
      </InfoSection>
      {copy.sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
          <InfoList items={section.items} />
        </InfoSection>
      ))}
      <InfoSection>
        <p className="rounded-xl border border-accent/50 bg-accent/10 p-4 text-sm leading-6">{copy.footer}</p>
      </InfoSection>
    </InfoArticle>
  );
}
