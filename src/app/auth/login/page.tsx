/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { googleLoginUrl, isLoginLockedError, login } from "@/lib/pirkApi";
import { rememberReturnPath, returnQuery, safeReturnPath } from "@/lib/safeReturn";

function LoginInner() {
  const { tr } = useLanguage();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const returnTo = search.get("return");
  const forSelling = Boolean(returnTo?.startsWith("/sell"));
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

  const field = "h-14 w-full rounded-full bg-muted px-5 text-[15px] text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-accent";

  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">{tr("Welcome back", "Sveiki sugrįžę", "С возвращением")}</h1>
        <p className="mt-2 text-center text-[15px] text-muted-foreground">
          {forSelling
            ? tr(
                "Sign in or create an account to post a listing. You will come back to the form right after.",
                "Prisijunkite arba susikurkite paskyrą, kad galėtumėte įdėti skelbimą. Po to grįšite į formą.",
                "Войдите или создайте аккаунт, чтобы подать объявление. Сразу после этого вы вернётесь к форме."
              )
            : tr("Sign in to your Wheelio account", "Prisijunkite į savo Wheelio paskyrą", "Войдите в аккаунт Wheelio")}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block px-1 text-sm font-semibold">E-mail</span>
            <input type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-2 block px-1 text-sm font-semibold">{tr("Password", "Slaptažodis", "Пароль")}</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          <div className="flex justify-end px-1">
            <Link href="/auth/forgot-password" className="text-sm font-semibold text-accent-ink hover:underline">
              {tr("Forgot password?", "Pamiršote slaptažodį?", "Забыли пароль?")}
            </Link>
          </div>

          {notice && !error && <div className="rounded-2xl bg-green-500/10 p-3 text-sm text-green-700">{notice}</div>}
          {error && <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}

          <button disabled={loading} className="h-14 w-full rounded-full bg-accent text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60">
            {loading ? "…" : tr("Log in", "Prisijungti", "Войти")}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">{tr("or", "arba", "или")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <a
          href={googleLoginUrl()}
          onClick={() => rememberReturnPath(returnTo)}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border bg-card font-bold transition hover:bg-muted"
        >
          <img src="/icons/google.svg" alt="" width={20} height={20} className="h-5 w-5" />
          {tr("Continue with Google", "Tęsti su Google", "Войти через Google")}
        </a>

        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          {tr(
            "If you are new, continuing with Google creates an account: you confirm you are 18 or older, agree to the ",
            "Jei esate naujas naudotojas, tęsiant su Google sukuriama paskyra: patvirtinate, kad jums yra bent 18 metų, sutinkate su ",
            "Если вы новый пользователь, вход через Google создаёт аккаунт: вы подтверждаете, что вам есть 18 лет, принимаете "
          )}
          <Link href="/rules" className="underline">{tr("Rules", "Taisyklėmis", "Правила")}</Link>
          {tr(" and have read the ", " ir susipažinote su ", " и ознакомились с ")}
          <Link href="/privacy" className="underline">{tr("Privacy policy", "Privatumo politika", "Политикой конфиденциальности")}</Link>.
        </p>

        <p className="mt-6 text-center text-sm">
          {tr("Don't have an account?", "Neturite paskyros?", "Нет аккаунта?")}{" "}
          <Link href={`/auth/register${returnQuery(returnTo)}`} className="font-bold text-accent-ink hover:underline">
            {tr("Create account", "Sukurti paskyrą", "Создать аккаунт")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-[72vh]" />}><LoginInner /></Suspense>;
}
