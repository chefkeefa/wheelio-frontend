// src/app/auth/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass || !pass2) {
      alert("Užpildykite visus laukus");
      return;
    }
    if (pass !== pass2) {
      alert("Slaptažodžiai nesutampa");
      return;
    }
    // Позже подключим реальный API
    console.log("Register submit", { email, pass });
    alert("Registracija (demo) — vėliau prijungsime API.");
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Registruotis</h1>

      <form onSubmit={onSubmit} className="rounded-lg border bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-600">El. paštas</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="you@email.lt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">Pakartokite slaptažodį</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="••••••••"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <button type="submit" className="w-full rounded-lg bg-black text-white py-2">
          Registruotis
        </button>

        <div className="text-sm text-gray-600 text-center">
          Jau turite paskyrą?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Prisijungti
          </Link>
        </div>
      </form>
    </section>
  );
}
