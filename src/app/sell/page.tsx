/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/Button";
import { anybody } from "@/lib/fonts";
import {
  ListingDraft,
  loadDraft,
  saveDraft,
  clearDraft,
  ContactMethod,
} from "@/lib/sellDraft";

// --------- ВСПОМОГАТЕЛЬНОЕ ---------
const FEATURES = [
  "Climate control",
  "Leather seats",
  "Heated seats",
  "Parking sensors",
  "LED lights",
  "Navigation",
  "Winter tires",
  "Apple CarPlay / Android Auto",
];

const INITIAL: ListingDraft = {
  plateOrVin: "",
  mark: "",
  model: "",
  year: "",
  engine: "",
  photoNames: [],
  mileage: "",
  owners: "",
  hasServiceBook: false,
  nextServiceDate: "",
  condition: "clean",
  features: [],
  description: "",
  price: "",
  strategy: "fixed",
  allowBargain: false,
  city: "",
  area: "",
  contactMethods: ["chat"],
  phone: "",
  viewingWeekdays: "",
  viewingWeekend: "",
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl bg-white ring-1 ring-[hsl(var(--border))] p-4 md:p-6", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={`${anybody.className} mb-4 text-2xl font-bold`}>{children}</h2>
  );
}

// подсказка цены (MVP-фикция)
function usePriceHint(draft: ListingDraft) {
  return useMemo(() => {
    if (!draft.mark || !draft.model || !draft.year) return null;
    const base = 10000;
    const year = parseInt(draft.year || "0", 10);
    const age = year ? Math.max(0, 2025 - year) : 5;
    const adj = Math.max(2000, 15000 - age * 700);
    const low = Math.max(2000, base + adj - 1500);
    const high = base + adj + 800;
    return { low, high };
  }, [draft.mark, draft.model, draft.year]);
}

function formatEUR(n: number) {
  try {
    return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString()} €`;
  }
}

// --------- СТРАНИЦА ---------
export default function SellPage() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ListingDraft>(INITIAL);
  const [photos, setPhotos] = useState<File[]>([]); // в память, в localStorage не кладём
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // загрузка черновика
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setDraft(d);
    }
  }, []);

  // автосейв (debounce ~400ms)
  const saveRaf = useRef<number | null>(null);
  useEffect(() => {
    if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    saveRaf.current = requestAnimationFrame(() => {
      saveDraft(draft);
      setLastSaved(new Date());
    });
    return () => {
      if (saveRaf.current) cancelAnimationFrame(saveRaf.current);
    };
  }, [draft]);

  const priceHint = usePriceHint(draft);

  // вспомогательная разметка ввода
  const L = ({ children }: { children: React.ReactNode }) => (
    <label className={`${anybody.className} block text-[15px] md:text-base font-bold text-[hsl(var(--muted-foreground))] mb-1`}>
      {children}
    </label>
  );
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={cx(
        anybody.className,
        "w-full rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-2.5 text-[15px] font-bold text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--accent))]"
      )}
    />
  );
  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className={cx(
        anybody.className,
        "w-full min-h-[120px] rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-3 text-[15px] font-bold text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--accent))] resize-vertical"
      )}
    />
  );
  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
      {...props}
      className={cx(
        anybody.className,
        "w-full appearance-none rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9] px-4 py-2.5 text-[15px] font-bold text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--accent))]"
      )}
    />
  );

  // публикация (MVP-заглушка)
  const publish = async () => {
    // TODO: заменить на реальный бэк
    alert("✅ Draft prepared for publish. Подключим реальный бэкенд, когда пришлёшь эндпоинт.");
    clearDraft();
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`${anybody.className} text-3xl md:text-4xl font-extrabold`}>Sell a car</h1>
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          {lastSaved ? `Draft saved ${lastSaved.toLocaleTimeString()}` : "Draft not saved yet"}
        </div>
      </div>

      {/* Степпер */}
      <Card className="p-3 md:p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {["Car", "Photos", "Condition", "Price", "Contacts", "Preview"].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={label}
                className={cx(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active && "bg-[hsl(var(--accent))] text-white",
                  !active && "bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))/0.8]",
                )}
                onClick={() => setStep(n)}
              >
                {n}. {label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ШАГ 1 — автомобиль */}
      {step === 1 && (
        <Card>
          <SectionTitle>Identify your car</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <L>Plate (LT) or VIN</L>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. ABC123 / WBAXX..."
                  value={draft.plateOrVin}
                  onChange={(e) => setDraft({ ...draft, plateOrVin: e.target.value })}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    // MVP: фейковый автозаполнитель
                    if (draft.plateOrVin.trim().length > 0) {
                      setDraft((d) => ({
                        ...d,
                        mark: d.mark || "BMW",
                        model: d.model || "3 Series",
                        year: d.year || "2017",
                        engine: d.engine || "2.0D (110 kW)",
                      }));
                    }
                  }}
                >
                  Autofill
                </Button>
              </div>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                We only use it to prefill the form. Nothing will be published without your consent.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <L>Mark</L>
                <Select
                  value={draft.mark || "Any"}
                  onChange={(e) => setDraft({ ...draft, mark: e.target.value === "Any" ? "" : e.target.value })}
                >
                  <option>Any</option>
                  <option>BMW</option>
                  <option>Mercedes</option>
                  <option>Audi</option>
                  <option>Volkswagen</option>
                </Select>
              </div>
              <div>
                <L>Model</L>
                <Input
                  placeholder="e.g. 320d"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                />
              </div>
            </div>

            <div>
              <L>Year</L>
              <Input
                placeholder="2017"
                value={draft.year}
                onChange={(e) => setDraft({ ...draft, year: e.target.value.replace(/\D+/g, "").slice(0, 4) })}
              />
            </div>
            <div>
              <L>Engine</L>
              <Input
                placeholder="2.0D (110 kW)"
                value={draft.engine}
                onChange={(e) => setDraft({ ...draft, engine: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Skip
            </Button>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 2 — фото */}
      {step === 2 && (
        <Card>
          <SectionTitle>Photos & video</SectionTitle>
          <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
            Add key angles to increase trust. We’ll help you with a checklist.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div
                className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
                  setPhotos((prev) => [...prev, ...files]);
                  setDraft((d) => ({ ...d, photoNames: [...d.photoNames, ...files.map((f) => f.name)] }));
                }}
              >
                <div className="text-center">
                  <div className={`${anybody.className} mb-2 text-lg font-bold`}>Drop photos here</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">or use the button below</div>
                </div>
              </div>

              <div className="mt-3">
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPhotos((prev) => [...prev, ...files]);
                    setDraft((d) => ({ ...d, photoNames: [...d.photoNames, ...files.map((f) => f.name)] }));
                  }}
                  className="hidden"
                />
                <Button as="label" htmlFor="photo-input" className="cursor-pointer">
                  Upload from device
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {photos.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} className="relative h-28 overflow-hidden rounded-xl ring-1 ring-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <img src={url} alt={f.name} className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className={`${anybody.className} mb-2 text-base font-bold`}>Checklist</div>
              <ul className="space-y-2 text-sm">
                {[
                  "Front",
                  "Rear",
                  "Side profile",
                  "Interior",
                  "Dashboard & mileage",
                  "VIN plate",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                Tip: we can mask plates later for privacy.
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>
              Skip
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 3 — состояние/комплектация */}
      {step === 3 && (
        <Card>
          <SectionTitle>Condition & equipment</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>Mileage</L>
              <Input
                placeholder="145 000"
                value={draft.mileage}
                onChange={(e) => setDraft({ ...draft, mileage: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div>
              <L>Owners</L>
              <Input
                placeholder="1"
                value={draft.owners}
                onChange={(e) => setDraft({ ...draft, owners: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div className="flex items-end gap-3">
              <input
                id="service-book"
                type="checkbox"
                checked={draft.hasServiceBook}
                onChange={(e) => setDraft({ ...draft, hasServiceBook: e.target.checked })}
                className="h-5 w-5 rounded border-[hsl(var(--border))]"
              />
              <label htmlFor="service-book" className="text-sm">Has service book / docs</label>
            </div>

            <div>
              <L>Next service until</L>
              <Input
                type="date"
                value={draft.nextServiceDate}
                onChange={(e) => setDraft({ ...draft, nextServiceDate: e.target.value })}
              />
            </div>

            <div>
              <L>Condition</L>
              <Select
                value={draft.condition}
                onChange={(e) => setDraft({ ...draft, condition: e.target.value as ListingDraft["condition"] })}
              >
                <option value="clean">Not crashed</option>
                <option value="minor">Minor paint</option>
                <option value="damaged">Crashed</option>
                <option value="needs_repair">Needs repair</option>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <L>Features</L>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {FEATURES.map((f) => {
                const checked = draft.features.includes(f);
                return (
                  <label key={f} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setDraft((d) => ({
                          ...d,
                          features: e.target.checked
                            ? [...d.features, f]
                            : d.features.filter((x) => x !== f),
                        }));
                      }}
                      className="h-4 w-4 rounded border-[hsl(var(--border))]"
                    />
                    <span className="text-sm">{f}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <L>Description</L>
            <Textarea
              placeholder="Tell about condition, maintenance, what you like about the car..."
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(4)}>
              Skip
            </Button>
            <Button onClick={() => setStep(4)}>Next</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 4 — цена */}
      {step === 4 && (
        <Card>
          <SectionTitle>Price & strategy</SectionTitle>

          {priceHint && (
            <div className="mb-4 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">
              Recommended: <strong>{formatEUR(priceHint.low)} – {formatEUR(priceHint.high)}</strong>
              <div className="text-[12px] text-[hsl(var(--muted-foreground))]">
                Based on similar cars and year.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>Price</L>
              <Input
                placeholder="12000"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D+/g, "") })}
              />
            </div>
            <div>
              <L>Strategy</L>
              <Select
                value={draft.strategy}
                onChange={(e) => setDraft({ ...draft, strategy: e.target.value as ListingDraft["strategy"] })}
              >
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
                <option value="quick">Quick sale</option>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <input
                id="bargain"
                type="checkbox"
                checked={draft.allowBargain}
                onChange={(e) => setDraft({ ...draft, allowBargain: e.target.checked })}
                className="h-5 w-5 rounded border-[hsl(var(--border))]"
              />
              <label htmlFor="bargain" className="text-sm">Allow small bargain</label>
            </div>
          </div>

          {/* простая подсказка времени продажи */}
          {!!draft.price && priceHint && (
            <div className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              With this price, expected time to sell ~{" "}
              <strong>
                {Number(draft.price) <= priceHint.low ? "5–7 days" :
                 Number(draft.price) <= priceHint.high ? "1–2 weeks" : "2–4 weeks"}
              </strong>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(5)}>
              Skip
            </Button>
            <Button onClick={() => setStep(5)}>Next</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 5 — контакты/расписание */}
      {step === 5 && (
        <Card>
          <SectionTitle>Contacts & schedule</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <L>City</L>
              <Input
                placeholder="Vilnius"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
            <div>
              <L>Area / district</L>
              <Input
                placeholder="Antakalnis"
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
              />
            </div>
            <div>
              <L>Phone</L>
              <Input
                placeholder="+370..."
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <L>Preferred contact methods</L>
            <div className="flex flex-wrap gap-2">
              {(["chat", "phone", "whatsapp", "telegram"] as ContactMethod[]).map((m) => {
                const on = draft.contactMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={cx(
                      "rounded-full px-3 py-1 text-sm ring-1",
                      on
                        ? "bg-[hsl(var(--accent))] text-white ring-transparent"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] ring-[hsl(var(--border))]"
                    )}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        contactMethods: on
                          ? d.contactMethods.filter((x) => x !== m)
                          : [...d.contactMethods, m],
                      }))
                    }
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <L>Weekdays time</L>
              <Input
                placeholder="e.g. 18:00–21:00"
                value={draft.viewingWeekdays}
                onChange={(e) => setDraft({ ...draft, viewingWeekdays: e.target.value })}
              />
            </div>
            <div>
              <L>Weekend time</L>
              <Input
                placeholder="e.g. by arrangement"
                value={draft.viewingWeekend}
                onChange={(e) => setDraft({ ...draft, viewingWeekend: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(6)}>
              Skip
            </Button>
            <Button onClick={() => setStep(6)}>Next</Button>
          </div>
        </Card>
      )}

      {/* ШАГ 6 — предпросмотр/публикация */}
      {step === 6 && (
        <Card>
          <SectionTitle>Preview & publish</SectionTitle>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl ring-1 ring-[hsl(var(--border))] overflow-hidden bg-white">
              <div className="relative h-56 bg-[hsl(var(--muted))]">
                {photos[0] ? (
                  <img
                    src={URL.createObjectURL(photos[0])}
                    alt="preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="https://placehold.co/800x600/png"
                    alt="placeholder"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className={`${anybody.className} text-[15px] font-bold`}>
                  {draft.mark || "Car"} {draft.model} {draft.year && `(${draft.year})`}
                </h3>
                <div className={`${anybody.className} mt-2 text-base font-bold text-[hsl(var(--accent))]`}>
                  {draft.price ? `${Number(draft.price).toLocaleString()} €` : "—"}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div><strong>Engine:</strong> {draft.engine || "—"}</div>
              <div><strong>Mileage:</strong> {draft.mileage ? `${draft.mileage} km` : "—"}</div>
              <div><strong>Condition:</strong> {draft.condition}</div>
              <div><strong>Features:</strong> {draft.features.length ? draft.features.join(", ") : "—"}</div>
              <div><strong>City/Area:</strong> {[draft.city, draft.area].filter(Boolean).join(", ") || "—"}</div>
              <div><strong>Contacts:</strong> {draft.contactMethods.join(", ") || "chat only"} {draft.phone && `(${draft.phone})`}</div>
              {priceHint && (
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <div>Recommended range: <strong>{formatEUR(priceHint.low)}–{formatEUR(priceHint.high)}</strong></div>
                </div>
              )}
              {draft.description && (
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <div className="font-medium mb-1">Description</div>
                  <div className="whitespace-pre-wrap">{draft.description}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => { clearDraft(); setDraft(INITIAL); setPhotos([]); }}>
              Clear draft
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Edit</Button>
              <Button onClick={publish}>Publish</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
