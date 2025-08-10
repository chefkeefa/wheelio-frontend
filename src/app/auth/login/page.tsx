// src/app/auth/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Пока только проверим, что поля заполнены
    if (!email || !pass) {
      alert("Įveskite el. paštą ir slaptažodį");
      return;
    }
    // Дальше подключим реальный API
    console.log("Login submit", { email, pass });
    alert("Prisijungimas (demo) — vėliau prijungsime API.");
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Prisijungti</h1>

      <form onSubmit={onSubmit} className="rounded-lg border bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-600">El. paštas</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="you@email.lt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">Slaptažodis</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="w-full rounded-lg bg-black text-white py-2">
          Prisijungti
        </button>

        <div className="text-sm text-gray-600 text-center">
          Neturite paskyros?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Registruotis
          </Link>
        </div>
      </form>
    </section>
  );
}
