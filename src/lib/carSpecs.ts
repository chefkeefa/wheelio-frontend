/** Catalog specifications of a listing's modification (see GET /api/public/listings/:id). */
export type CarSpecs = {
  generation?: string | null;
  generationFrom?: number | null;
  generationTo?: number | null;
  modification?: string | null;
  bodyType?: string | null;
  doors?: number | null;
  seats?: string | null;
  engineType?: string | null;
  volumeLitres?: number | null;
  horsePower?: number | null;
  kwPower?: number | null;
  gearbox?: string | null;
  drive?: string | null;
  fuelGrade?: string | null;
  consumptionMixed?: number | null;
  consumptionCity?: number | null;
  consumptionHighway?: number | null;
  acceleration?: number | null;
  maxSpeed?: number | null;
  fuelTank?: number | null;
  trunk?: number | null;
  euroClass?: string | null;
  co2?: number | null;
  electricRange?: number | null;
  battery?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  clearance?: number | null;
};

type Tr = (en: string, lt: string, ru: string) => string;
type Labels = Record<string, [string, string, string]>;

// Values as the catalog stores them (English, lower case).
const ENGINE: Labels = {
  gasoline: ["Petrol", "Benzinas", "Бензин"],
  diesel: ["Diesel", "Dyzelinas", "Дизель"],
  hybrid: ["Hybrid", "Hibridas", "Гибрид"],
  electric: ["Electric", "Elektra", "Электро"],
  lpg: ["Petrol / LPG", "Benzinas / dujos", "Бензин / газ"],
  hydrogen: ["Hydrogen", "Vandenilis", "Водород"],
};
const GEARBOX: Labels = {
  mechanical: ["Manual", "Mechaninė", "Механика"],
  automatic: ["Automatic", "Automatinė", "Автомат"],
  robot: ["Robotised", "Robotizuota", "Робот"],
  variator: ["CVT", "Variatorius", "Вариатор"],
  // Values the seller form stores on listings_cars.
  auto: ["Automatic", "Automatinė", "Автомат"],
  manual: ["Manual", "Mechaninė", "Механика"],
};
const DRIVE: Labels = {
  "front-wheel drive": ["Front-wheel drive", "Priekiniai ratai", "Передний"],
  "rear-wheel drive": ["Rear-wheel drive", "Galiniai ratai", "Задний"],
  "all-wheel drive": ["All-wheel drive", "Visi ratai", "Полный"],
  front: ["Front-wheel drive", "Priekiniai ratai", "Передний"],
  rear: ["Rear-wheel drive", "Galiniai ratai", "Задний"],
  full: ["All-wheel drive", "Visi ratai", "Полный"],
};
const BODY: Labels = {
  sedan: ["Saloon", "Sedanas", "Седан"],
  "sedan 2 doors": ["2-door saloon", "Sedanas, 2 durys", "Седан 2 дв."],
  "sedan hardtop": ["Hardtop saloon", "Sedanas hardtop", "Седан хардтоп"],
  "hatchback 5 doors": ["Hatchback, 5 doors", "Hečbekas, 5 durys", "Хэтчбек 5 дв."],
  "hatchback 3 doors": ["Hatchback, 3 doors", "Hečbekas, 3 durys", "Хэтчбек 3 дв."],
  liftback: ["Liftback", "Liftbekas", "Лифтбек"],
  fastback: ["Fastback", "Fastbekas", "Фастбек"],
  "wagon 5 doors": ["Estate", "Universalas", "Универсал"],
  "wagon 3 doors": ["Estate, 3 doors", "Universalas, 3 durys", "Универсал 3 дв."],
  "suv 5 doors": ["SUV", "Visureigis", "Внедорожник"],
  "suv 3 doors": ["SUV, 3 doors", "Visureigis, 3 durys", "Внедорожник 3 дв."],
  "open suv": ["Open SUV", "Atviras visureigis", "Открытый внедорожник"],
  coupe: ["Coupe", "Kupė", "Купе"],
  "coupe hardtop": ["Hardtop coupe", "Kupė hardtop", "Купе хардтоп"],
  convertible: ["Convertible", "Kabrioletas", "Кабриолет"],
  roadster: ["Roadster", "Rodsteris", "Родстер"],
  targa: ["Targa", "Targa", "Тарга"],
  speedster: ["Speedster", "Spidsteris", "Спидстер"],
  minivan: ["MPV", "Vienatūris", "Минивэн"],
  "compact van": ["Compact MPV", "Kompaktinis vienatūris", "Компактвэн"],
  microvan: ["Microvan", "Mikroautobusas", "Микровэн"],
  van: ["Van", "Furgonas", "Фургон"],
  "pickup double cab": ["Pickup, double cab", "Pikapas, dviguba kabina", "Пикап двойная кабина"],
  "pickup single cab": ["Pickup, single cab", "Pikapas, viengubė kabina", "Пикап одинарная кабина"],
  "pickup extended cab": ["Pickup, extended cab", "Pikapas, pailginta kabina", "Пикап полуторная кабина"],
};

function label(map: Labels, value: string | null | undefined, tr: Tr) {
  if (!value) return null;
  const hit = map[value.trim().toLowerCase()];
  return hit ? tr(...hit) : value;
}

const num = (n: number, digits = 0) => new Intl.NumberFormat("lt-LT", { maximumFractionDigits: digits }).format(n);

export type SpecRow = { label: string; value: string };
export type SpecSection = { title: string; rows: SpecRow[] };

/** Label/value rows for the listing page; rows without a value are left out. */
export function specSections(specs: CarSpecs | null | undefined, tr: Tr): SpecSection[] {
  if (!specs) return [];
  const s = specs;
  const row = (label: string, value: string | null | false | undefined): SpecRow | null => (value ? { label, value } : null);
  const fuelGrade = s.fuelGrade && /RON/i.test(s.fuelGrade) ? s.fuelGrade.replace(/\s*RON/i, "") : null;
  const engine = [
    label(ENGINE, s.engineType, tr),
    s.volumeLitres ? `${num(s.volumeLitres, 1)} l` : null,
    s.horsePower ? `${num(s.horsePower)} ${tr("hp", "AG", "л.с.")}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const consumption = [
    s.consumptionMixed ? `${num(s.consumptionMixed, 1)} ${tr("combined", "mišrus", "смешанный")}` : null,
    s.consumptionCity ? `${num(s.consumptionCity, 1)} ${tr("city", "mieste", "город")}` : null,
    s.consumptionHighway ? `${num(s.consumptionHighway, 1)} ${tr("highway", "užmiestyje", "трасса")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const generation = s.generation
    ? `${s.generation}${s.generationFrom ? ` (${s.generationFrom}–${s.generationTo ?? tr("now", "dabar", "н.в.")})` : ""}`
    : null;
  const size = s.length && s.width && s.height ? `${num(s.length)} × ${num(s.width)} × ${num(s.height)} mm` : null;

  const sections: SpecSection[] = [
    {
      title: tr("Engine and drivetrain", "Variklis ir transmisija", "Двигатель и трансмиссия"),
      rows: [
        row(tr("Engine", "Variklis", "Двигатель"), engine),
        row(tr("Power", "Galia", "Мощность"), s.kwPower ? `${num(s.kwPower)} kW` : null),
        row(tr("Fuel", "Kuras", "Топливо"), fuelGrade ? tr(`Petrol ${fuelGrade}`, `Benzinas ${fuelGrade}`, `АИ-${fuelGrade}`) : null),
        row(tr("Gearbox", "Pavarų dėžė", "Коробка"), label(GEARBOX, s.gearbox, tr)),
        row(tr("Drive", "Varomieji ratai", "Привод"), label(DRIVE, s.drive, tr)),
        row(tr("Battery", "Baterija", "Батарея"), s.battery ? `${num(s.battery, 1)} kWh` : null),
        row(tr("Electric range", "Elektrinė rida", "Запас хода на электричестве"), s.electricRange ? `${num(s.electricRange)} km` : null),
      ].filter((x): x is SpecRow => Boolean(x)),
    },
    {
      title: tr("Performance and economy", "Dinamika ir sąnaudos", "Динамика и расход"),
      rows: [
        row(tr("0–100 km/h", "0–100 km/h", "Разгон 0–100 км/ч"), s.acceleration ? `${num(s.acceleration, 1)} s` : null),
        row(tr("Top speed", "Maks. greitis", "Макс. скорость"), s.maxSpeed ? `${num(s.maxSpeed)} km/h` : null),
        row(tr("Consumption, l/100 km", "Sąnaudos, l/100 km", "Расход, л/100 км"), consumption),
        row(tr("Fuel tank", "Bako talpa", "Объём бака"), s.fuelTank ? `${num(s.fuelTank)} l` : null),
        row(tr("Emission class", "Taršos klasė", "Экокласс"), s.euroClass),
        row("CO₂", s.co2 ? `${num(s.co2)} g/km` : null),
      ].filter((x): x is SpecRow => Boolean(x)),
    },
    {
      title: tr("Body", "Kėbulas", "Кузов"),
      rows: [
        row(tr("Generation", "Karta", "Поколение"), generation),
        row(tr("Version", "Modifikacija", "Модификация"), s.modification),
        row(tr("Body type", "Kėbulo tipas", "Тип кузова"), label(BODY, s.bodyType, tr)),
        row(tr("Doors", "Durys", "Двери"), s.doors ? String(s.doors) : null),
        row(tr("Seats", "Vietos", "Мест"), s.seats ? s.seats.replace(/;/g, "/") : null),
        row(tr("Boot", "Bagažinė", "Багажник"), s.trunk ? `${num(s.trunk)} l` : null),
        row(tr("L × W × H", "Ilgis × plotis × aukštis", "Д × Ш × В"), size),
        row(tr("Ground clearance", "Prošvaisa", "Клиренс"), s.clearance ? `${num(s.clearance)} mm` : null),
        row(tr("Weight", "Masė", "Масса"), s.weight ? `${num(s.weight)} kg` : null),
      ].filter((x): x is SpecRow => Boolean(x)),
    },
  ];
  return sections.filter((x) => x.rows.length > 0);
}

/** Short label for a catalog gearbox or drive value, shown in the summary rows. */
export function gearboxLabel(value: string | null | undefined, tr: Tr) {
  return label(GEARBOX, value, tr);
}
export function driveLabel(value: string | null | undefined, tr: Tr) {
  return label(DRIVE, value, tr);
}
export function engineLabel(value: string | null | undefined, tr: Tr) {
  return label(ENGINE, value, tr);
}
export function bodyLabel(value: string | null | undefined, tr: Tr) {
  return label(BODY, value, tr);
}
