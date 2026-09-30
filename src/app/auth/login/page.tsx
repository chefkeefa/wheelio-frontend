/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { googleLoginUrl, login } from "@/lib/wheelioApi";

function LoginInner() {
  const { language } = useLanguage();
  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (search.get("oauthError")) setError(tr("Google sign-in failed. Please try again.", "Nepavyko prisijungti per Google. Bandykite dar kartą.", "Не удалось войти через Google. Попробуйте ещё раз."));
  }, [search, language]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await login(email, password);
      const target = search.get("return") || "/";
      router.replace(target.startsWith("/") ? target : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Login failed", "Prisijungti nepavyko", "Не удалось войти"));
    } finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-[calc(100svh-86px)] items-center justify-center bg-background px-4 py-10 text-foreground page-photo page-photo-auth">
      <div className="w-full max-w-xl rounded-2xl border-2 border-accent bg-card p-8">
        <h1 className="mb-6 text-center text-5xl font-bold">{tr("Login", "Prisijungti", "Войти")}</h1>
        <form onSubmit={submit} className="space-y-5">
          <label className="block"><span className="mb-2 block font-bold">E-mail</span><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 w-full rounded-lg bg-[#cecece] px-4 text-black outline-none focus:ring-2 focus:ring-accent" /></label>
          <label className="block"><span className="mb-2 block font-bold">{tr("Password","Slaptažodis","Пароль")}</span><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="h-12 w-full rounded-lg bg-[#cecece] px-4 text-black outline-none focus:ring-2 focus:ring-accent" /></label>
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="h-12 w-full rounded-lg bg-[#5f5f5f] font-bold text-white hover:bg-accent disabled:opacity-60">{loading ? "…" : tr("Login","Prisijungti","Войти")}</button>
        </form>
        <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border"/><span className="text-xs font-semibold text-muted-foreground">{tr("or","arba","или")}</span><div className="h-px flex-1 bg-border"/></div>
        <a href={googleLoginUrl()} className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background font-bold transition hover:bg-muted">
          <img src="/icons/google.svg" alt="" className="h-6 w-6" />
          {tr("Continue with Google","Tęsti su Google","Войти через Google")}
        </a>
        <div className="mt-5 flex justify-between gap-4 text-sm font-semibold">
          <Link href="/auth/register" className="hover:text-accent">{tr("Create account","Sukurti paskyrą","Создать аккаунт")}</Link>
          <Link href="/auth/forgot-password" className="hover:text-accent">{tr("Forgot password?","Pamiršote slaptažodį?","Забыли пароль?")}</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-[72vh]" />}><LoginInner /></Suspense>;
}
