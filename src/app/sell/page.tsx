// src/app/sell/page.tsx
"use client";

import { useState } from "react";

type FormData = {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  city: string;
};

const initial: FormData = {
  brand: "",
  model: "",
  year: "",
  mileage: "",
  price: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  city: "",
};

export default function SellPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initial);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  const submit = () => {
    // Пока просто выводим данные — позже привяжем к бэку
    console.log("Sell form submit", data);
    alert("Skelbimas išsaugotas (demo). Vėliau prijungsime tikrą API.");
    setStep(1);
    setData(initial);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Parduoti automobilį</h1>

      {/* Индикатор шагов */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 rounded ${i <= step ? "bg-black" : "bg-gray-200"}`}
          />
        ))}
      </div>

      {/* Контент шага */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-semibold">1. Pagrindinė informacija</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="rounded border px-3 py-2" placeholder="Markė (pvz., BMW)" value={data.brand} onChange={update("brand")} />
              <input className="rounded border px-3 py-2" placeholder="Modelis (pvz., 320d)" value={data.model} onChange={update("model")} />
              <input className="rounded border px-3 py-2" placeholder="Metai (pvz., 2016)" value={data.year} onChange={update("year")} />
              <input className="rounded border px-3 py-2" placeholder="Rida (km)" value={data.mileage} onChange={update("mileage")} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold">2. Kaina ir aprašymas</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="rounded border px-3 py-2" placeholder="Kaina (€)" value={data.price} onChange={update("price")} />
              <textarea className="sm:col-span-2 rounded border px-3 py-2 h-32" placeholder="Trumpas aprašymas" value={data.description} onChange={update("description")} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-semibold">3. Kontaktai</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="rounded border px-3 py-2" placeholder="Vardas" value={data.name} onChange={update("name")} />
              <input className="rounded border px-3 py-2" placeholder="Telefonas" value={data.phone} onChange={update("phone")} />
              <input className="rounded border px-3 py-2" placeholder="El. paštas" value={data.email} onChange={update("email")} />
              <input className="rounded border px-3 py-2" placeholder="Miestas" value={data.city} onChange={update("city")} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-semibold">4. Peržiūra</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Automobilis</div>
                <div>Markė: {data.brand || "-"}</div>
                <div>Modelis: {data.model || "-"}</div>
                <div>Metai: {data.year || "-"}</div>
                <div>Rida: {data.mileage || "-"}</div>
                <div>Kaina: {data.price || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Kontaktai</div>
                <div>Vardas: {data.name || "-"}</div>
                <div>Telefonas: {data.phone || "-"}</div>
                <div>El. paštas: {data.email || "-"}</div>
                <div>Miestas: {data.city || "-"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="font-medium mb-1">Aprašymas</div>
                <div className="rounded border bg-gray-50 p-3 min-h-16">
                  {data.description || "—"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Кнопки навигации */}
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 1}
          className="px-4 py-2 rounded-md border disabled:opacity-50"
        >
          Atgal
        </button>
        {step < 4 ? (
          <button onClick={next} className="px-4 py-2 rounded-lg bg-black text-white">
            Toliau
          </button>
        ) : (
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-black text-white">
            Pateikti (demo)
          </button>
        )}
      </div>
    </section>
  );
}
