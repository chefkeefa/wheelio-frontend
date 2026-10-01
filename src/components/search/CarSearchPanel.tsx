"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import AssetIcon, { type AssetIconName } from "@/components/ui/AssetIcon";
import Dropdown from "@/components/search/Dropdown";
import { useLanguage } from "@/context/LanguageContext";
import { BACKEND_ORIGIN } from "@/lib/config";
import { getPublicListingCount } from "@/lib/listings";
import { LT_CITIES } from "@/lib/cities";
import { EMPTY_FILTERS, countParameterFilters, filtersToQuery, type CarFilters } from "@/lib/carFilters";

const CAR_API = `${BACKEND_ORIGIN}/cars`;
const FIRST_YEAR = 1980;

type Option = { value: string; label: string };
type Sheet = "make" | "city" | "year" | "price" | "params" | null;

interface Props {
  filters: CarFilters;
  onChange: (next: CarFilters) => void;
  /** Runs the search with the current filters. */
  onSubmit: () => void;
  searching?: boolean;
}

/**
 * Car search: one make + model field on top, year and price ranges below, and a
 * "Parameters" sheet for everything else. Mobile opens each part in a bottom sheet;
 * desktop shows year and price inline and expands the parameters under the panel.
 */
export default function CarSearchPanel({ filters, onChange, onSubmit, searching = false }: Props) {
  const { tr, language } = useLanguage();
  const set = (patch: Partial<CarFilters>) => onChange({ ...filters, ...patch });

  const [sheet, setSheet] = useState<Sheet>(null);
  const [pickerStep, setPickerStep] = useState<"mark" | "model">("mark");
  const [pickerSearch, setPickerSearch] = useState("");
  const [paramsOpen, setParamsOpen] = useState(false);

  const [marks, setMarks] = useState<Array<{ id: string; name: string }>>([]);
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  const locale = language === "RU" ? "ru-RU" : language === "LT" ? "lt-LT" : "en-US";
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);

  useEffect(() => {
    let cancelled = false;
    fetch(`${CAR_API}?size=500`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`Failed to load marks: ${response.status}`))))
      .then((data) => {
        if (cancelled) return;
        const list: Array<{ id?: unknown; name?: unknown }> = Array.isArray(data?.content) ? data.content : [];
        setMarks(
          list
            .filter((m): m is { id: string; name: string } => typeof m?.id === "string" && typeof m?.name === "string" && m.name.trim().length > 0)
            .map((m) => ({ id: m.id, name: m.name })),
        );
      })
      .catch((error) => {
        console.error("Error loading marks:", error);
        if (!cancelled) setMarks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markId = marks.find((m) => m.name === filters.mark)?.id;
  useEffect(() => {
    setModels([]);
    if (!markId) {
      setModelsLoading(false);
      return;
    }
    let cancelled = false;
    setModelsLoading(true);
    fetch(`${CAR_API}/${encodeURIComponent(markId)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`Failed to load models: ${response.status}`))))
      .then((data) => {
        if (cancelled) return;
        const list: Array<{ name?: unknown }> = Array.isArray(data) ? data : [];
        setModels(list.map((m) => (typeof m?.name === "string" ? m.name.trim() : "")).filter(Boolean));
      })
      .catch((error) => {
        console.error("Error loading models:", error);
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [markId]);

  // Live count for the "show listings" button; the backend counts with the same filters as the search.
  const countKey = JSON.stringify({ ...filtersToQuery(filters), sort: undefined });
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCountLoading(true);
      try {
        const n = await getPublicListingCount(JSON.parse(countKey));
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setCountLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [countKey]);

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheet]);

  const pickerOptions = useMemo(() => {
    const list = pickerStep === "model" ? models : marks.map((m) => m.name);
    const needle = pickerSearch.trim().toLocaleLowerCase();
    return needle ? list.filter((name) => name.toLocaleLowerCase().includes(needle)) : list;
  }, [pickerStep, models, marks, pickerSearch]);

  const parameterCount = countParameterFilters(filters);

  const labels = {
    makeModel: tr("Make, model", "Markė, modelis", "Марка, модель"),
    make: tr("Make", "Markė", "Марка"),
    model: tr("Model", "Modelis", "Модель"),
    year: tr("Year", "Metai", "Год"),
    price: tr("Price", "Kaina", "Цена"),
    city: tr("City", "Miestas", "Город"),
    anyCity: tr("All Lithuania", "Visa Lietuva", "Вся Литва"),
    params: tr("Parameters", "Parametrai", "Параметры"),
    from: tr("from", "nuo", "от"),
    to: tr("to", "iki", "до"),
    close: tr("Close", "Uždaryti", "Закрыть"),
    reset: tr("Reset all", "Išvalyti viską", "Сбросить все"),
    show: tr("Show listings", "Rodyti skelbimus", "Показать объявления"),
  };
  const showLabel = searching ? tr("Searching…", "Ieškoma…", "Ищем…") : `${labels.show} · ${countLoading ? "…" : formatNumber(count)}`;

  const yearOptions = useMemo(() => {
    const last = new Date().getFullYear() + 1;
    return Array.from({ length: last - FIRST_YEAR + 1 }, (_, i) => String(last - i)).map((y) => ({ value: y, label: y }));
  }, []);

  const makeModelValue = filters.mark ? [filters.mark, filters.model].filter(Boolean).join(" ") : "";
  const rangeText = (min: string, max: string, format: (v: string) => string) => {
    if (min && max) return min === max ? format(min) : `${format(min)}–${format(max)}`;
    if (min) return `${labels.from} ${format(min)}`;
    if (max) return `${labels.to} ${format(max)}`;
    return "";
  };
  const shortPrice = (v: string) => {
    const n = Number(v);
    return n >= 1000 ? `${formatNumber(Math.round(n / 100) / 10)}k` : formatNumber(n);
  };
  const yearValue = rangeText(filters.yearMin, filters.yearMax, (v) => v);
  const priceValue = rangeText(filters.priceMin, filters.priceMax, shortPrice);

  const openMakePicker = () => {
    setPickerSearch("");
    setPickerStep(filters.mark ? "model" : "mark");
    setSheet("make");
  };
  const submit = () => {
    setSheet(null);
    onSubmit();
  };
  const resetAll = () => onChange({ ...EMPTY_FILTERS });
  const resetParameters = () =>
    set({
      mileageMax: "",
      powerMin: "",
      powerMax: "",
      volumeMin: "",
      volumeMax: "",
      drive: "",
      transmission: "",
      fuel: "",
      category: "",
      doors: "",
      withPhoto: false,
      sort: EMPTY_FILTERS.sort,
    });

  const yearFields = (dark: boolean) => (
    <RangeSelects
      dark={dark}
      fromLabel={labels.from}
      toLabel={labels.to}
      options={yearOptions}
      min={filters.yearMin}
      max={filters.yearMax}
      onChange={(yearMin, yearMax) => set({ yearMin, yearMax })}
    />
  );
  const priceFields = (dark: boolean) => (
    <RangeInputs
      dark={dark}
      fromLabel={labels.from}
      toLabel={labels.to}
      suffix="€"
      min={filters.priceMin}
      max={filters.priceMax}
      onChange={(priceMin, priceMax) => set({ priceMin, priceMax })}
    />
  );
  const searchButton = (className: string) => (
    <button
      type="button"
      onClick={submit}
      disabled={searching}
      className={`flex items-center justify-center gap-2.5 whitespace-nowrap font-extrabold text-accent-foreground transition active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {showLabel}
    </button>
  );

  return (
    <>
      {/* Mobile */}
      <div className="mb-4 rounded-3xl bg-card p-3 shadow-xl ring-1 ring-border md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-[2px] overflow-hidden rounded-2xl">
          <MobileCell className="col-span-3 px-4" label={labels.makeModel} value={makeModelValue} onClick={openMakePicker} />
          <MobileCell className="col-span-3 px-4" label={labels.city} value={filters.city} onClick={() => setSheet("city")} />
          <MobileCell label={labels.year} value={yearValue} onClick={() => setSheet("year")} />
          <MobileCell label={labels.price} value={priceValue && `${priceValue} €`} onClick={() => setSheet("price")} />
          <button
            type="button"
            onClick={() => setSheet("params")}
            className="flex min-h-14 items-center justify-center gap-1.5 bg-muted px-3 text-[13px] font-semibold text-foreground active:opacity-80"
          >
            <AssetIcon name="filter" size={16} />
            {labels.params}
            {parameterCount > 0 && <Badge value={parameterCount} />}
          </button>
        </div>
        {searchButton("mt-3 min-h-12 w-full rounded-2xl bg-accent px-4 text-sm")}
      </div>

      {/* Desktop */}
      <div className="hidden rounded-2xl bg-ink/95 p-6 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md md:block lg:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 border-b-2 border-accent pb-2 text-sm font-semibold text-white">
            <AssetIcon name="car" size={20} className="text-accent" />
            {tr("Passenger cars", "Lengvieji automobiliai", "Легковые автомобили")}
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/85 transition hover:text-accent"
          >
            <AssetIcon name="reset" size={16} />
            {labels.reset}
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
          <div className="relative">
            <button
              type="button"
              onClick={openMakePicker}
              className="flex h-16 w-full min-w-0 items-center gap-3 rounded-xl bg-white/[0.06] pl-4 pr-20 text-left ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <AssetIcon name="car" size={24} className="text-white/80" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-5 text-white">{labels.makeModel}</span>
                <span className="block truncate text-sm leading-5 text-white/55">{makeModelValue || tr("Any", "Bet kuri", "Любая")}</span>
              </span>
            </button>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-1">
              {filters.mark && (
                <button
                  type="button"
                  aria-label={tr("Clear make and model", "Išvalyti markę ir modelį", "Сбросить марку и модель")}
                  onClick={() => set({ mark: "", model: "" })}
                  className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <AssetIcon name="close" size={16} />
                </button>
              )}
              <AssetIcon name="chevron-down" size={18} className="text-white/60" />
            </div>
          </div>
          <DesktopBox icon="map-pin" label={labels.city}>
            <Dropdown
              variant="inline"
              ariaLabel={labels.city}
              value={filters.city}
              placeholder={labels.anyCity}
              options={LT_CITIES.map((city) => ({ value: city, label: city }))}
              onChange={(city) => set({ city })}
              searchable
              searchPlaceholder={tr("Search", "Ieškoti", "Поиск")}
              className="w-full"
            />
          </DesktopBox>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <DesktopBox icon="calendar" label={labels.year}>
            {yearFields(true)}
          </DesktopBox>
          <DesktopBox icon="euro" label={`${labels.price}, €`}>
            {priceFields(true)}
          </DesktopBox>
          <button
            type="button"
            onClick={() => setParamsOpen((value) => !value)}
            aria-expanded={paramsOpen}
            className={`flex h-16 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold ring-1 transition ${
              paramsOpen ? "bg-white/10 text-accent ring-accent" : "bg-white/[0.06] text-white ring-white/10 hover:bg-white/10"
            }`}
          >
            <AssetIcon name="filter" size={18} />
            {labels.params}
            {parameterCount > 0 && <Badge value={parameterCount} />}
          </button>
          {searchButton("h-16 rounded-xl bg-accent px-7 text-base hover:brightness-110")}
        </div>

        <div className={`grid transition-all duration-300 ease-out ${paramsOpen ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="border-t border-white/10 pt-6">
              <ParameterFields dark filters={filters} set={set} />
            </div>
          </div>
        </div>
      </div>

      {sheet === "make" && (
        <SheetFrame
          title={pickerStep === "mark" ? labels.make : labels.model}
          subtitle={pickerStep === "model" ? filters.mark : undefined}
          closeLabel={labels.close}
          onClose={() => setSheet(null)}
          onBack={
            pickerStep === "model"
              ? () => {
                  setPickerSearch("");
                  setPickerStep("mark");
                }
              : undefined
          }
          backLabel={tr("Back", "Atgal", "Назад")}
          footer={searchButton("min-h-12 w-full rounded-2xl bg-accent px-4 text-sm")}
        >
          <div className="px-4 pt-4">
            <input
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder={tr("Search", "Ieškoti", "Поиск")}
              aria-label={tr("Search", "Ieškoti", "Поиск")}
              className="h-12 w-full rounded-2xl border border-border bg-muted px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-2">
            <PickerRow
              label={pickerStep === "mark" ? tr("All makes", "Visos markės", "Все марки") : tr("All models", "Visi modeliai", "Все модели")}
              selected={pickerStep === "mark" ? !filters.mark : !filters.model}
              onClick={() => {
                if (pickerStep === "mark") set({ mark: "", model: "" });
                else set({ model: "" });
                setSheet(null);
              }}
            />
            {pickerOptions.length ? (
              pickerOptions.map((name) => (
                <PickerRow
                  key={name}
                  label={name}
                  selected={pickerStep === "mark" ? filters.mark === name : filters.model === name}
                  chevron={pickerStep === "mark"}
                  onClick={() => {
                    setPickerSearch("");
                    if (pickerStep === "mark") {
                      if (filters.mark !== name) set({ mark: name, model: "" });
                      setPickerStep("model");
                    } else {
                      set({ model: name });
                      setSheet(null);
                    }
                  }}
                />
              ))
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {pickerStep === "model" && modelsLoading ? tr("Loading models…", "Įkeliami modeliai…", "Загружаем модели…") : tr("Nothing found", "Nieko nerasta", "Ничего не найдено")}
              </p>
            )}
          </div>
        </SheetFrame>
      )}

      {sheet === "city" && (
        <SheetFrame title={labels.city} closeLabel={labels.close} onClose={() => setSheet(null)} footer={searchButton("min-h-12 w-full rounded-2xl bg-accent px-4 text-sm")}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-2">
            <PickerRow
              label={labels.anyCity}
              selected={!filters.city}
              onClick={() => {
                set({ city: "" });
                setSheet(null);
              }}
            />
            {LT_CITIES.map((city) => (
              <PickerRow
                key={city}
                label={city}
                selected={filters.city === city}
                onClick={() => {
                  set({ city });
                  setSheet(null);
                }}
              />
            ))}
          </div>
        </SheetFrame>
      )}

      {sheet === "year" && (
        <SheetFrame title={labels.year} closeLabel={labels.close} onClose={() => setSheet(null)} footer={searchButton("min-h-12 w-full rounded-2xl bg-accent px-4 text-sm")}>
          <div className="px-5 py-6">{yearFields(false)}</div>
        </SheetFrame>
      )}

      {sheet === "price" && (
        <SheetFrame title={`${labels.price}, €`} closeLabel={labels.close} onClose={() => setSheet(null)} footer={searchButton("min-h-12 w-full rounded-2xl bg-accent px-4 text-sm")}>
          <div className="px-5 py-6">{priceFields(false)}</div>
        </SheetFrame>
      )}

      {sheet === "params" && (
        <SheetFrame
          title={labels.params}
          closeLabel={labels.close}
          onClose={() => setSheet(null)}
          tall
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetParameters}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-bold text-foreground"
              >
                <AssetIcon name="reset" size={16} />
                {tr("Reset", "Išvalyti", "Сбросить")}
              </button>
              {searchButton("min-h-12 flex-1 rounded-2xl bg-accent px-4 text-sm")}
            </div>
          }
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <ParameterFields filters={filters} set={set} />
          </div>
        </SheetFrame>
      )}
    </>
  );
}

/* ------------------------------------------------------------------------- */

function ParameterFields({ filters, set, dark = false }: { filters: CarFilters; set: (patch: Partial<CarFilters>) => void; dark?: boolean }) {
  const { tr } = useLanguage();
  const any = tr("Any", "Bet kuri", "Любой");
  const from = tr("from", "nuo", "от");
  const to = tr("to", "iki", "до");

  const fuelOptions: Option[] = [
    { value: "", label: any },
    { value: "PETROL", label: tr("Petrol", "Benzinas", "Бензин") },
    { value: "DIESEL", label: tr("Diesel", "Dyzelinas", "Дизель") },
    { value: "GAS", label: tr("Gas", "Dujos", "Газ") },
    { value: "ELECTRO", label: tr("Electric", "Elektra", "Электро") },
  ];
  const bodyOptions: Option[] = [
    { value: "", label: any },
    { value: "saloon", label: tr("Saloon", "Sedanas", "Седан") },
    { value: "hatchback", label: tr("Hatchback", "Hečbekas", "Хэтчбек") },
    { value: "estate", label: tr("Estate", "Universalas", "Универсал") },
    { value: "suv", label: "SUV" },
    { value: "coupe", label: tr("Sports / coupe", "Sportinis / kupė", "Спорт / купе") },
    { value: "cabriolet", label: tr("Cabriolet", "Kabrioletas", "Кабриолет") },
    { value: "small", label: tr("Small car", "Mažas automobilis", "Малый автомобиль") },
  ];
  const doorOptions: Option[] = [
    { value: "", label: any },
    { value: "2_3", label: "2/3" },
    { value: "4_5", label: "4/5" },
  ];
  const mileageOptions: Option[] = [
    { value: "", label: any },
    ...[25_000, 50_000, 100_000, 150_000, 200_000, 250_000, 300_000].map((km) => ({
      value: String(km),
      label: `${tr("up to", "iki", "до")} ${km.toLocaleString("lt-LT")} km`,
    })),
  ];
  const volumeOptions: Option[] = ["1.0", "1.2", "1.4", "1.6", "1.8", "2.0", "2.5", "3.0", "3.5", "4.0", "5.0"].map((v) => ({ value: v, label: `${v} l` }));
  const powerOptions: Option[] = [50, 75, 100, 125, 150, 200, 250, 300].map((kw) => ({ value: String(kw), label: `${kw} kW` }));
  const sortOptions: Option[] = [
    { value: "newest", label: tr("Newest first", "Naujausi pirmiausia", "Сначала новые") },
    { value: "price_asc", label: tr("Price: low to high", "Kaina: nuo mažiausios", "Цена: по возрастанию") },
    { value: "price_desc", label: tr("Price: high to low", "Kaina: nuo didžiausios", "Цена: по убыванию") },
    { value: "oldest", label: tr("Oldest first", "Seniausi pirmiausia", "Сначала старые") },
    { value: "mileage_asc", label: tr("Mileage: low to high", "Rida: nuo mažiausios", "Пробег: по возрастанию") },
    { value: "mileage_desc", label: tr("Mileage: high to low", "Rida: nuo didžiausios", "Пробег: по убыванию") },
    { value: "year_desc", label: tr("Year: newest first", "Metai: naujausi pirmiausia", "Год: сначала новые") },
    { value: "year_asc", label: tr("Year: oldest first", "Metai: seniausi pirmiausia", "Год: сначала старые") },
  ];

  return (
    <div className={`grid gap-6 ${dark ? "lg:grid-cols-3 lg:gap-x-10" : ""}`}>
      <div className="space-y-6">
        <Segmented
          dark={dark}
          label={tr("Drive", "Varomieji ratai", "Привод")}
          value={filters.drive}
          onChange={(drive) => set({ drive })}
          options={[
            { value: "", label: any },
            { value: "FULL", label: "4x4" },
            { value: "FRONT", label: tr("Front", "Priekiniai", "Передний") },
            { value: "REAR", label: tr("Rear", "Galiniai", "Задний") },
          ]}
        />
        <Segmented
          dark={dark}
          label={tr("Gearbox", "Pavarų dėžė", "Коробка передач")}
          value={filters.transmission}
          onChange={(transmission) => set({ transmission })}
          options={[
            { value: "", label: any },
            { value: "AUTO", label: tr("Automatic", "Automatinė", "Автомат") },
            { value: "MANUAL", label: tr("Manual", "Mechaninė", "Механика") },
          ]}
        />
        <Segmented dark={dark} label={tr("Doors", "Durų skaičius", "Двери")} value={filters.doors} onChange={(doors) => set({ doors })} options={doorOptions} />
      </div>

      <div className="space-y-4">
        <SelectField dark={dark} label={tr("Fuel", "Kuras", "Топливо")} value={filters.fuel} options={fuelOptions} onChange={(fuel) => set({ fuel })} />
        <SelectField dark={dark} label={tr("Body type", "Kėbulo tipas", "Тип кузова")} value={filters.category} options={bodyOptions} onChange={(category) => set({ category })} />
        <SelectField dark={dark} label={tr("Mileage", "Rida", "Пробег")} value={filters.mileageMax} options={mileageOptions} onChange={(mileageMax) => set({ mileageMax })} />
      </div>

      <div className="space-y-4">
        <FieldLabel dark={dark} label={tr("Engine size, l", "Variklio tūris, l", "Объём двигателя, л")}>
          <RangeSelects
            dark={dark}
            compact
            fromLabel={from}
            toLabel={to}
            options={volumeOptions}
            min={filters.volumeMin}
            max={filters.volumeMax}
            onChange={(volumeMin, volumeMax) => set({ volumeMin, volumeMax })}
          />
        </FieldLabel>
        <FieldLabel dark={dark} label={tr("Power, kW", "Galia, kW", "Мощность, кВт")}>
          <RangeSelects
            dark={dark}
            compact
            fromLabel={from}
            toLabel={to}
            options={powerOptions}
            min={filters.powerMin}
            max={filters.powerMax}
            onChange={(powerMin, powerMax) => set({ powerMin, powerMax })}
          />
        </FieldLabel>
        <SelectField dark={dark} label={tr("Sort", "Rūšiavimas", "Сортировка")} value={filters.sort} options={sortOptions} onChange={(sort) => set({ sort })} />
        <label className={`flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold ${dark ? "text-white" : "text-foreground"}`}>
          <input
            type="checkbox"
            checked={filters.withPhoto}
            onChange={(event) => set({ withPhoto: event.target.checked })}
            className="h-5 w-5 shrink-0 cursor-pointer rounded accent-accent"
          />
          {tr("With photos only", "Tik su nuotraukomis", "Только с фото")}
        </label>
      </div>
    </div>
  );
}

/** Two selects for a range; picking a "from" above the "to" moves the "to" along. */
function RangeSelects({
  min,
  max,
  options,
  onChange,
  fromLabel,
  toLabel,
  dark = false,
  compact = false,
}: {
  min: string;
  max: string;
  options: Option[];
  onChange: (min: string, max: string) => void;
  fromLabel: string;
  toLabel: string;
  dark?: boolean;
  compact?: boolean;
}) {
  const n = (v: string) => Number(v);
  const above = (a: string, b: string) => a !== "" && b !== "" && n(a) > n(b);
  const cls = dark
    ? "h-8 min-w-0 flex-1 cursor-pointer appearance-none rounded-md bg-transparent text-sm text-white/80 outline-none focus:text-white"
    : `${compact ? "h-12" : "h-14"} min-w-0 flex-1 cursor-pointer appearance-none rounded-xl border border-border bg-muted px-4 text-center ${compact ? "text-sm" : "text-lg"} font-semibold text-foreground outline-none focus:border-accent`;
  const optionCls = dark ? "bg-white text-black" : undefined;
  if (dark) {
    return (
      <div className="flex items-center gap-2">
        <Dropdown
          variant="inline"
          ariaLabel={fromLabel}
          placeholder={fromLabel}
          value={min}
          options={options}
          onChange={(value) => onChange(value, above(value, max) ? value : max)}
          className="flex-1"
        />
        <span className="text-white/30">—</span>
        <Dropdown
          variant="inline"
          ariaLabel={toLabel}
          placeholder={toLabel}
          value={max}
          options={options}
          onChange={(value) => onChange(above(min, value) ? value : min, value)}
          className="flex-1"
        />
      </div>
    );
  }
  return (
    <div className={`flex items-center ${dark ? "gap-1.5" : "gap-3"}`}>
      <select
        aria-label={fromLabel}
        value={min}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value, above(value, max) ? value : max);
        }}
        className={cls}
      >
        <option value="" className={optionCls}>
          {fromLabel}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className={optionCls}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={dark ? "text-white/40" : "text-muted-foreground"}>—</span>
      <select
        aria-label={toLabel}
        value={max}
        onChange={(event) => {
          const value = event.target.value;
          onChange(above(min, value) ? value : min, value);
        }}
        className={cls}
      >
        <option value="" className={optionCls}>
          {toLabel}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className={optionCls}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeInputs({
  min,
  max,
  onChange,
  fromLabel,
  toLabel,
  suffix,
  dark = false,
}: {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  fromLabel: string;
  toLabel: string;
  suffix: string;
  dark?: boolean;
}) {
  const digits = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 9);
  const show = (value: string) => (value ? Number(value).toLocaleString("lt-LT") : "");
  const cls = dark
    ? "h-8 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/55"
    : "h-14 w-full min-w-0 rounded-xl border border-border bg-muted px-4 text-lg font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-accent";
  return (
    <div className={`flex items-center ${dark ? "gap-1.5" : "gap-3"}`}>
      <input inputMode="numeric" aria-label={`${fromLabel}, ${suffix}`} placeholder={fromLabel} value={show(min)} onChange={(e) => onChange(digits(e.target.value), max)} className={cls} />
      <span className={dark ? "text-white/40" : "text-muted-foreground"}>—</span>
      <input inputMode="numeric" aria-label={`${toLabel}, ${suffix}`} placeholder={toLabel} value={show(max)} onChange={(e) => onChange(min, digits(e.target.value))} className={cls} />
    </div>
  );
}

function Segmented({ label, value, onChange, options, dark = false }: { label: string; value: string; onChange: (value: string) => void; options: Option[]; dark?: boolean }) {
  return (
    <div role="group" aria-label={label}>
      <div className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-foreground"}`}>{label}</div>
      <div className={`flex rounded-xl p-1 ${dark ? "bg-white/[0.06] ring-1 ring-white/10" : "bg-muted"}`}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value || "any"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`min-h-10 min-w-0 flex-1 truncate rounded-lg px-1 text-[13px] font-semibold transition ${
                active ? "bg-accent text-accent-foreground shadow-sm" : dark ? "text-white/80 hover:text-white" : "text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({ label, dark, children }: { label: string; dark: boolean; children: ReactNode }) {
  return (
    <div>
      <div className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-foreground"}`}>{label}</div>
      {dark ? <div className="rounded-xl bg-white/[0.06] px-4 py-2 ring-1 ring-white/10">{children}</div> : children}
    </div>
  );
}

function SelectField({ label, value, options, onChange, dark = false }: { label: string; value: string; options: Option[]; onChange: (value: string) => void; dark?: boolean }) {
  if (dark) {
    const any = options.find((o) => o.value === "");
    return (
      <div>
        <span className="mb-2 block text-sm font-semibold text-white">{label}</span>
        <Dropdown
          ariaLabel={label}
          value={value}
          options={options.filter((o) => o.value !== "")}
          placeholder={any?.label ?? label}
          clearable={Boolean(any)}
          onChange={onChange}
          className="w-full"
        />
      </div>
    );
  }
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-foreground"}`}>{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-12 w-full cursor-pointer appearance-none rounded-xl px-4 pr-10 text-sm font-semibold outline-none ${
            dark ? "bg-white/[0.06] text-white ring-1 ring-white/10 focus:ring-accent" : "border border-border bg-muted text-foreground focus:border-accent"
          }`}
        >
          {options.map((o) => (
            <option key={o.value || "any"} value={o.value} className={dark ? "bg-white text-black" : undefined}>
              {o.label}
            </option>
          ))}
        </select>
        <AssetIcon name="chevron-down" size={16} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${dark ? "text-white/60" : "text-muted-foreground"}`} />
      </span>
    </label>
  );
}

function DesktopBox({ icon, label, children }: { icon: AssetIconName; label: string; children: ReactNode }) {
  return (
    <div className="flex h-16 min-w-0 items-center gap-3 rounded-xl bg-white/[0.06] px-4 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-accent">
      <AssetIcon name={icon} size={24} className="text-white/80" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-5 text-white">{label}</div>
        {children}
      </div>
    </div>
  );
}

function MobileCell({ label, value, onClick, className = "" }: { label: string; value: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-14 min-w-0 flex-col justify-center bg-muted px-3 text-left active:opacity-80 ${className}`}>
      {value ? (
        <>
          <span className="block truncate text-[11px] font-medium leading-4 text-muted-foreground">{label}</span>
          <span className="block truncate text-sm font-bold text-foreground">{value}</span>
        </>
      ) : (
        <span className="block truncate text-base text-muted-foreground">{label}</span>
      )}
    </button>
  );
}

function Badge({ value }: { value: number }) {
  return <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-accent-foreground">{value}</span>;
}

function PickerRow({ label, selected, onClick, chevron = false }: { label: string; selected: boolean; onClick: () => void; chevron?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 w-full items-center justify-between gap-3 border-b border-border/70 px-3 text-left text-sm font-semibold ${selected ? "text-accent-ink dark:text-accent" : "text-foreground"}`}
    >
      <span className="truncate">{label}</span>
      {selected ? <AssetIcon name="check" size={18} className="shrink-0" /> : chevron ? <AssetIcon name="chevron-right" size={16} className="shrink-0 text-muted-foreground" /> : null}
    </button>
  );
}

function SheetFrame({
  title,
  subtitle,
  closeLabel,
  onClose,
  onBack,
  backLabel,
  footer,
  tall = false,
  children,
}: {
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  footer: ReactNode;
  tall?: boolean;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 md:items-center md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex w-full flex-col rounded-t-[28px] bg-card shadow-2xl md:max-w-lg md:rounded-3xl ${tall ? "h-[92dvh] md:h-auto md:max-h-[85vh]" : "max-h-[90dvh]"}`}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-4">
          {onBack && (
            <button type="button" onClick={onBack} aria-label={backLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <AssetIcon name="arrow-left" size={20} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-extrabold text-foreground">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <AssetIcon name="close" size={20} />
          </button>
        </div>
        {children}
        <div className="border-t border-border bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
      </section>
    </div>,
    document.body,
  );
}
