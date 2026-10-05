"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { confirmEmailVerification } from "@/lib/pirkApi";

type Result = { purpose: "VERIFY" | "CHANGE"; email: string; signedOut: boolean };

function VerifyEmailInner() {
  const { tr } = useLanguage();
  const search = useSearchParams();
  const started = useRef(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  // The one-time token is read once and removed from the address bar, then confirmed automatically.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = search.get("token") || "";
    if (token) window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setError(tr("The link is incomplete.", "Nuoroda neišsami.", "Ссылка неполная."));
      return;
    }
    confirmEmailVerification(token)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [search, tr]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
        <h1 className="mb-4 text-3xl font-bold tracking-tight">{tr("E-mail confirmation", "El. pašto patvirtinimas", "Подтверждение e-mail")}</h1>
        {!result && !error && <p className="text-muted-foreground">…</p>}
        {error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-red-600" role="alert">
            {error}
            <p className="mt-2 text-sm">
              {tr(
                "You can request a new link in your profile.",
                "Naują nuorodą galite gauti profilyje.",
                "Новую ссылку можно запросить в профиле."
              )}
            </p>
          </div>
        )}
        {result && (
          <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400" role="status">
            {result.purpose === "CHANGE"
              ? tr(
                  `Your e-mail is now ${result.email}. Please sign in again.`,
                  `Jūsų el. paštas dabar ${result.email}. Prisijunkite iš naujo.`,
                  `Ваш e-mail теперь ${result.email}. Войдите заново.`
                )
              : tr(
                  `${result.email} is confirmed. You can publish listings.`,
                  `${result.email} patvirtintas. Galite skelbti skelbimus.`,
                  `${result.email} подтверждён. Теперь можно публиковать объявления.`
                )}
          </div>
        )}
        <div className="mt-6 flex gap-4 text-sm font-semibold">
          {result?.signedOut ? (
            <Link href="/auth/login" className="text-accent-ink underline">{tr("Sign in", "Prisijungti", "Войти")}</Link>
          ) : (
            <Link href="/account/profile" className="text-accent-ink underline">{tr("Profile", "Profilis", "Профиль")}</Link>
          )}
          <Link href="/" className="text-muted-foreground underline">{tr("Home", "Pradžia", "Главная")}</Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
