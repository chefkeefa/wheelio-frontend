"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { googleLoginUrl, isLoginLockedError, login } from "@/lib/pirkApi";
import { safeReturnPath } from "@/lib/safeReturn";

function LoginInner() {
  const { tr } = useLanguage();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (search.get("oauthError")) setError(tr("Google sign-in failed. Please try again.", "Nepavyko prisijungti per Google. Bandykite dar kartą.", "Не удалось войти через Google. Попробуйте ещё раз."));
    if (search.get("reset") === "1") setNotice(tr("Password changed. Sign in with the new password.", "Slaptažodis pakeistas. Prisijunkite nauju slaptažodžiu.", "Пароль изменён. Войдите с новым паролем."));
    else if (search.get("registered") === "1") setNotice(tr("Account created. You can sign in now.", "Paskyra sukurta. Dabar galite prisijungti.", "Аккаунт создан. Теперь можно войти."));
  }, [search, tr]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await login(email, password);
      router.replace(safeReturnPath(search.get("return")));
      router.refresh();
    } catch (e) {
      if (isLoginLockedError(e))
        setError(tr(
          "Too many wrong passwords were entered for this account. To sign in from this device, reset your password (Forgot password?) or continue with Google.",
          "Šiai paskyrai įvesta per daug neteisingų slaptažodžių. Norėdami prisijungti šiame įrenginyje, atkurkite slaptažodį (Pamiršote slaptažodį?) arba tęskite su Google.",
          "Для этого аккаунта введено слишком много неверных паролей. Чтобы войти с этого устройства, восстановите пароль («Забыли пароль?») или войдите через Google."
        ));
      else setError(e instanceof Error ? e.message : tr("Login failed", "Prisijungti nepavyko", "Не удалось войти"));
    } finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">{tr("Login", "Prisijungti", "Войти")}</h1>
        <form onSubmit={submit} className="space-y-5">
          <label className="block"><span className="mb-2 block font-bold">E-mail</span><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 w-full rounded-lg bg-muted px-4 text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent" /></label>
          <label className="block"><span className="mb-2 block font-bold">{tr("Password","Slaptažodis","Пароль")}</span><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="h-12 w-full rounded-lg bg-muted px-4 text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent" /></label>
          {notice && !error && <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700">{notice}</div>}
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="h-12 w-full rounded-lg bg-primary font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60">{loading ? "…" : tr("Login","Prisijungti","Войти")}</button>
        </form>
        <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border"/><span className="text-xs font-semibold text-muted-foreground">{tr("or","arba","или")}</span><div className="h-px flex-1 bg-border"/></div>
        <a href={googleLoginUrl()} className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background font-bold transition hover:bg-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-black text-[#4285F4]">G</span>
          {tr("Continue with Google","Tęsti su Google","Войти через Google")}
        </a>
        <div className="mt-5 flex justify-between gap-4 text-sm font-semibold">
          <Link href="/auth/register" className="hover:text-accent-ink">{tr("Create account","Sukurti paskyrą","Создать аккаунт")}</Link>
          <Link href="/auth/forgot-password" className="hover:text-accent-ink">{tr("Forgot password?","Pamiršote slaptažodį?","Забыли пароль?")}</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-[72vh]" />}><LoginInner /></Suspense>;
}
