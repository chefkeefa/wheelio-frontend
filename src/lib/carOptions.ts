/**
 * Equipment a listing can show, grouped for display. Keys match the backend
 * (src/listings/car-options.ts), which takes them from the catalog `options` table.
 */
export type CarOption = { key: string; en: string; lt: string; ru: string };
export type CarOptionGroup = { id: string; en: string; lt: string; ru: string; options: CarOption[] };

const o = (key: string, en: string, lt: string, ru: string): CarOption => ({ key, en, lt, ru });

export const CAR_OPTION_GROUPS: CarOptionGroup[] = [
  {
    id: "comfort",
    en: "Comfort",
    lt: "Komfortas",
    ru: "Комфорт",
    options: [
      o("condition", "Air conditioning", "Kondicionierius", "Кондиционер"),
      o("climate-control-1", "Climate control", "Klimato kontrolė", "Климат-контроль"),
      o("climate-control-2", "Dual-zone climate control", "Dviejų zonų klimato kontrolė", "Двухзонный климат-контроль"),
      o("multizone-climate-control", "Multi-zone climate control", "Kelių zonų klimato kontrolė", "Многозонный климат-контроль"),
      o("cruise-control", "Cruise control", "Pastovaus greičio palaikymas", "Круиз-контроль"),
      o("auto-cruise", "Adaptive cruise control", "Adaptyvus greičio palaikymas", "Адаптивный круиз-контроль"),
      o("keyless-entry", "Keyless entry", "Beraktė prieiga", "Бесключевой доступ"),
      o("start-button", "Push-button start", "Variklio užvedimas mygtuku", "Запуск кнопкой"),
      o("remote-engine-start", "Remote engine start", "Nuotolinis variklio užvedimas", "Дистанционный запуск двигателя"),
      o("programmed-block-heater", "Auxiliary heater", "Autonominis šildytuvas (Webasto)", "Предпусковой подогреватель"),
      o("start-stop-function", "Start-stop system", "Start-stop sistema", "Система старт-стоп"),
      o("electro-window-front", "Power front windows", "Elektra valdomi priekiniai langai", "Электростеклоподъёмники передние"),
      o("electro-window-back", "Power rear windows", "Elektra valdomi galiniai langai", "Электростеклоподъёмники задние"),
      o("electro-mirrors", "Power mirrors", "Elektra reguliuojami veidrodžiai", "Электрорегулировка зеркал"),
      o("auto-mirrors", "Power-folding mirrors", "Elektra suskleidžiami veidrodžiai", "Электроскладывание зеркал"),
      o("electro-trunk", "Power tailgate", "Elektra valdomas bagažinės dangtis", "Электропривод багажника"),
      o("easy-trunk-opening", "Hands-free tailgate", "Bagažinės atidarymas koja", "Открытие багажника без рук"),
      o("power-latching-doors", "Soft-close doors", "Durų pritraukėjai", "Доводчики дверей"),
      o("multi-wheel", "Multifunction steering wheel", "Daugiafunkcis vairas", "Мультифункциональный руль"),
      o("steering-wheel-gear-shift-paddles", "Paddle shifters", "Pavarų perjungimo svirtelės prie vairo", "Подрулевые лепестки"),
      o("e-adjustment-wheel", "Power steering column", "Elektra reguliuojamas vairas", "Электрорегулировка руля"),
      o("wheel-memory", "Steering wheel memory", "Vairo padėties atmintis", "Память положения руля"),
      o("projection-display", "Head-up display", "Projekcinis ekranas", "Проекционный дисплей"),
      o("electronic-gage-panel", "Digital instrument cluster", "Skaitmeninis prietaisų skydelis", "Цифровая приборная панель"),
      o("computer", "Trip computer", "Borto kompiuteris", "Бортовой компьютер"),
      o("drive-mode-sys", "Drive mode selector", "Važiavimo režimų pasirinkimas", "Выбор режима движения"),
      o("cooling-box", "Cooled glovebox", "Šaldomas daiktadėžė", "Охлаждаемый перчаточный ящик"),
      o("servo", "Power steering", "Vairo stiprintuvas", "Усилитель руля"),
    ],
  },
  {
    id: "parking",
    en: "Parking",
    lt: "Parkavimas",
    ru: "Парковка",
    options: [
      o("park-assist-f", "Front parking sensors", "Priekiniai parkavimo jutikliai", "Парктроники передние"),
      o("park-assist-r", "Rear parking sensors", "Galiniai parkavimo jutikliai", "Парктроники задние"),
      o("rear-camera", "Rear-view camera", "Galinio vaizdo kamera", "Камера заднего вида"),
      o("front-camera", "Front camera", "Priekinė kamera", "Фронтальная камера"),
      o("360-camera", "360° camera", "360° kameros", "Камеры кругового обзора"),
      o("auto-park", "Park assist", "Automatinis parkavimas", "Автопарковщик"),
    ],
  },
  {
    id: "interior",
    en: "Seats and interior",
    lt: "Sėdynės ir salonas",
    ru: "Сиденья и салон",
    options: [
      o("leather", "Leather upholstery", "Odinis salonas", "Кожаный салон"),
      o("eco-leather", "Faux leather", "Dirbtinė oda", "Экокожа"),
      o("alcantara", "Alcantara", "Alcantara", "Алькантара"),
      o("fabric-seats", "Cloth upholstery", "Medžiaginis salonas", "Тканевый салон"),
      o("combo-interior", "Combined upholstery", "Kombinuotas salonas", "Комбинированный салон"),
      o("sport-seats", "Sport seats", "Sportinės sėdynės", "Спортивные сиденья"),
      o("driver-seat-electric", "Power driver seat", "Elektra reguliuojama vairuotojo sėdynė", "Электрорегулировка сиденья водителя"),
      o("passenger-seat-electric", "Power passenger seat", "Elektra reguliuojama keleivio sėdynė", "Электрорегулировка сиденья пассажира"),
      o("driver-seat-memory", "Driver seat memory", "Vairuotojo sėdynės atmintis", "Память сиденья водителя"),
      o("seat-memory", "Front seats memory", "Priekinių sėdynių atmintis", "Память передних сидений"),
      o("front-seats-heat", "Heated front seats", "Šildomos priekinės sėdynės", "Подогрев передних сидений"),
      o("front-seats-heat-vent", "Ventilated front seats", "Vėdinamos priekinės sėdynės", "Вентиляция передних сидений"),
      o("rear-seats-heat", "Heated rear seats", "Šildomos galinės sėdynės", "Подогрев задних сидений"),
      o("rear-seat-heat-vent", "Ventilated rear seats", "Vėdinamos galinės sėdynės", "Вентиляция задних сидений"),
      o("massage-seats", "Massage seats", "Masažuojančios sėdynės", "Массаж сидений"),
      o("electro-rear-seat", "Power rear seats", "Elektra reguliuojamos galinės sėdynės", "Электрорегулировка задних сидений"),
      o("third-row-seats", "Third row seats", "Trečia sėdynių eilė", "Третий ряд сидений"),
      o("seat-transformation", "Folding rear seats", "Transformuojamos sėdynės", "Трансформация сидений"),
      o("front-centre-armrest", "Front armrest", "Priekinis porankis", "Передний подлокотник"),
      o("wheel-heat", "Heated steering wheel", "Šildomas vairas", "Подогрев руля"),
      o("wheel-leather", "Leather steering wheel", "Odinis vairas", "Кожаный руль"),
      o("panorama-roof", "Panoramic roof", "Panoraminis stogas", "Панорамная крыша"),
      o("hatch", "Sunroof", "Liukas", "Люк"),
      o("tinted-glass", "Tinted windows", "Tamsinti stiklai", "Тонированные стёкла"),
      o("decorative-interior-lighting", "Ambient lighting", "Dekoratyvinis salono apšvietimas", "Декоративная подсветка салона"),
      o("roller-blind-for-rear-window", "Rear window blind", "Galinio lango užuolaida", "Шторка заднего стекла"),
      o("roller-blinds-for-rear-side-windows", "Rear side window blinds", "Galinių šoninių langų užuolaidos", "Шторки задних боковых стёкол"),
    ],
  },
  {
    id: "multimedia",
    en: "Multimedia",
    lt: "Multimedija",
    ru: "Мультимедиа",
    options: [
      o("navigation", "Navigation", "Navigacija", "Навигация"),
      o("apple-carplay", "Apple CarPlay", "Apple CarPlay", "Apple CarPlay"),
      o("android-auto", "Android Auto", "Android Auto", "Android Auto"),
      o("bluetooth", "Bluetooth", "Bluetooth", "Bluetooth"),
      o("usb", "USB", "USB", "USB"),
      o("aux", "AUX", "AUX", "AUX"),
      o("audiosystem-cd", "CD audio system", "CD garso sistema", "Аудиосистема с CD"),
      o("music-super", "Premium audio", "Aukščiausios klasės garso sistema", "Премиальная аудиосистема"),
      o("wireless-charger", "Wireless charging", "Belaidis įkrovimas", "Беспроводная зарядка"),
      o("voice-recognition", "Voice control", "Balso valdymas", "Голосовое управление"),
      o("entertainment-system-for-rear-seat-passengers", "Rear entertainment", "Pramogų sistema galiniams keleiviams", "Мультимедиа для задних пассажиров"),
      o("12v-socket", "12V socket", "12V lizdas", "Розетка 12V"),
      o("220v-socket", "220V socket", "220V lizdas", "Розетка 220V"),
    ],
  },
  {
    id: "lights",
    en: "Lights and visibility",
    lt: "Žibintai ir matomumas",
    ru: "Свет и обзор",
    options: [
      o("led-lights", "LED headlights", "LED žibintai", "Светодиодные фары"),
      o("xenon", "Xenon headlights", "Ksenoniniai žibintai", "Ксеноновые фары"),
      o("laser-lights", "Laser headlights", "Lazeriniai žibintai", "Лазерные фары"),
      o("adaptive-light", "Adaptive headlights", "Adaptyvūs žibintai", "Адаптивное освещение"),
      o("high-beam-assist", "High beam assist", "Automatinės tolimosios šviesos", "Автоматический дальний свет"),
      o("automatic-lighting-control", "Automatic headlights", "Automatinis šviesų įjungimas", "Автоматическое включение фар"),
      o("light-sensor", "Light sensor", "Šviesos jutiklis", "Датчик света"),
      o("rain-sensor", "Rain sensor", "Lietaus jutiklis", "Датчик дождя"),
      o("drl", "Daytime running lights", "Dieniniai žibintai", "Дневные ходовые огни"),
      o("ptf", "Fog lights", "Rūko žibintai", "Противотуманные фары"),
      o("light-cleaner", "Headlight washers", "Žibintų plovikliai", "Омыватели фар"),
      o("mirrors-heat", "Heated mirrors", "Šildomi veidrodžiai", "Подогрев зеркал"),
      o("windscreen-heat", "Heated windscreen", "Šildomas priekinis stiklas", "Подогрев лобового стекла"),
      o("windcleaner-heat", "Heated wiper area", "Šildoma valytuvų zona", "Подогрев зоны дворников"),
      o("heated-wash-system", "Heated washer nozzles", "Šildomi purkštukai", "Подогрев форсунок омывателя"),
    ],
  },
  {
    id: "safety",
    en: "Safety",
    lt: "Saugumas",
    ru: "Безопасность",
    options: [
      o("abs", "ABS", "ABS", "ABS"),
      o("esp", "Stability control (ESP)", "Stabilumo kontrolė (ESP)", "Система стабилизации (ESP)"),
      o("asr", "Traction control", "Traukos kontrolė", "Антипробуксовочная система"),
      o("bas", "Brake assist", "Stabdymo pagalbos sistema", "Помощь при экстренном торможении"),
      o("hcc", "Hill start assist", "Pagalba pajudant į kalną", "Помощь при старте в гору"),
      o("dha", "Hill descent control", "Pagalba važiuojant nuokalne", "Помощь при спуске"),
      o("isofix", "Isofix", "Isofix", "Isofix"),
      o("airbag-driver", "Driver airbag", "Vairuotojo oro pagalvė", "Подушка безопасности водителя"),
      o("airbag-passenger", "Passenger airbag", "Keleivio oro pagalvė", "Подушка безопасности пассажира"),
      o("airbag-side", "Side airbags", "Šoninės oro pagalvės", "Боковые подушки"),
      o("airbag-curtain", "Curtain airbags", "Užuolaidinės oro pagalvės", "Подушки-шторки"),
      o("airbag-rear-side", "Rear side airbags", "Galinės šoninės oro pagalvės", "Задние боковые подушки"),
      o("knee-airbag", "Knee airbag", "Kelių oro pagalvė", "Коленная подушка"),
      o("blind-spot", "Blind spot monitor", "Aklosios zonos stebėjimas", "Контроль слепых зон"),
      o("lane-keeping-assist", "Lane keeping assist", "Eismo juostos palaikymas", "Удержание в полосе"),
      o("collision-prevention-assist", "Collision avoidance", "Susidūrimo prevencija", "Предотвращение столкновений"),
      o("traffic-sign-recognition", "Traffic sign recognition", "Kelio ženklų atpažinimas", "Распознавание дорожных знаков"),
      o("drowsy-driver-alert-system", "Driver fatigue alert", "Vairuotojo nuovargio stebėjimas", "Контроль усталости водителя"),
      o("night-vision", "Night vision", "Naktinis matymas", "Ночное видение"),
      o("tyre-pressure", "Tyre pressure monitor", "Padangų slėgio stebėjimas", "Датчики давления в шинах"),
    ],
  },
  {
    id: "security",
    en: "Anti-theft",
    lt: "Apsauga nuo vagystės",
    ru: "Защита от угона",
    options: [
      o("alarm", "Alarm", "Signalizacija", "Сигнализация"),
      o("immo", "Immobiliser", "Imobilaizeris", "Иммобилайзер"),
      o("lock", "Central locking", "Centrinis užraktas", "Центральный замок"),
      o("volume-sensor", "Interior motion sensor", "Salono judesio jutiklis", "Датчик объёма"),
    ],
  },
  {
    id: "exterior",
    en: "Exterior and chassis",
    lt: "Išorė ir važiuoklė",
    ru: "Экстерьер и ходовая",
    options: [
      o("air-suspension", "Air suspension", "Pneumatinė pakaba", "Пневмоподвеска"),
      o("activ-suspension", "Adaptive suspension", "Adaptyvi pakaba", "Адаптивная подвеска"),
      o("sport-suspension", "Sport suspension", "Sportinė pakaba", "Спортивная подвеска"),
      o("roof-rails", "Roof rails", "Stogo bėgeliai", "Рейлинги"),
      o("paint-metallic", "Metallic paint", "Metalizuoti dažai", "Металлик"),
      o("body-kit", "Body kit", "Kėbulo apdailos komplektas", "Обвес"),
      o("16-inch-wheels", "16\" alloy wheels", "16\" lengvojo lydinio ratlankiai", "Литые диски 16\""),
      o("17-inch-wheels", "17\" alloy wheels", "17\" lengvojo lydinio ratlankiai", "Литые диски 17\""),
      o("18-inch-wheels", "18\" alloy wheels", "18\" lengvojo lydinio ratlankiai", "Литые диски 18\""),
      o("19-inch-wheels", "19\" alloy wheels", "19\" lengvojo lydinio ratlankiai", "Литые диски 19\""),
      o("20-inch-wheels", "20\" alloy wheels", "20\" lengvojo lydinio ratlankiai", "Литые диски 20\""),
      o("21-inch-wheels", "21\" alloy wheels", "21\" lengvojo lydinio ratlankiai", "Литые диски 21\""),
      o("22-inch-wheels", "22\" alloy wheels", "22\" lengvojo lydinio ratlankiai", "Литые диски 22\""),
      o("spare-wheel", "Spare wheel", "Atsarginis ratas", "Запасное колесо"),
      o("towbar", "Towbar", "Kablys", "Фаркоп"),
    ],
  },
  {
    id: "extra",
    en: "Also included",
    lt: "Papildomai",
    ru: "Дополнительно",
    options: [
      o("winter-tires", "Winter tyres", "Žieminės padangos", "Зимние шины"),
      o("summer-tires", "Summer tyres", "Vasarinės padangos", "Летние шины"),
      o("service-book", "Service book", "Serviso knygelė", "Сервисная книжка"),
    ],
  },
];

export const CAR_OPTION_KEYS = new Set(CAR_OPTION_GROUPS.flatMap((g) => g.options.map((x) => x.key)));

/** Groups holding only the chosen keys, empty groups dropped. */
export function groupOptions(keys: readonly string[]): CarOptionGroup[] {
  const chosen = new Set(keys);
  return CAR_OPTION_GROUPS.map((g) => ({ ...g, options: g.options.filter((x) => chosen.has(x.key)) })).filter((g) => g.options.length > 0);
}

/** Old free-text features saved in sell drafts, mapped to option keys. */
export const LEGACY_FEATURE_KEYS: Record<string, string[]> = {
  "Climate control": ["climate-control-1"],
  "Leather seats": ["leather"],
  "Heated seats": ["front-seats-heat"],
  "Parking sensors": ["park-assist-r"],
  "LED lights": ["led-lights"],
  Navigation: ["navigation"],
  "Winter tires": ["winter-tires"],
  "Apple CarPlay / Android Auto": ["apple-carplay", "android-auto"],
};

/** Option keys from a draft's saved features, accepting old labels. */
export function featureKeys(features: readonly string[]): string[] {
  const out = new Set<string>();
  for (const f of features) {
    if (CAR_OPTION_KEYS.has(f)) out.add(f);
    for (const k of LEGACY_FEATURE_KEYS[f] ?? []) out.add(k);
  }
  return [...out];
}
