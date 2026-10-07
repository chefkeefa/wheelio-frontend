/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { rememberReturnPath, returnQuery } from "@/lib/safeReturn";
import { useLanguage } from "@/context/LanguageContext";
import PhoneVerificationBox from "@/components/PhoneVerificationBox";
import { googleLoginUrl, registerUser } from "@/lib/pirkApi";
import { usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { isStrongPassword } from "@/lib/passwordPolicy";

function RegisterInner() {
  const { tr } = useLanguage();
  const router = useRouter();
  const returnTo = useSearchParams().get("return");
  const [form, setForm] = useState({ email: "", name: "", surname: "", city: "", phone: "", password: "", confirm: "" });
  const [token, setToken] = useState("");
  const off = verificationOff(usePhoneVerificationConfig());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(form.password)) {
      setError(tr("The password does not meet the requirements", "Slaptažodis neatitinka reikalavimų", "Пароль не соответствует требованиям"));
      return;
    }
    if (form.password !== form.confirm) {
      setError(tr("Passwords do not match", "Slaptažodžiai nesutampa", "Пароли не совпадают"));
      return;
    }
    if (!token && !off) {
      setError(tr("Verify your phone first", "Pirmiausia patvirtinkite telefoną", "Сначала подтвердите телефон"));
      return;
    }
    setLoading(true);
    try {
      await registerUser({
        email: form.email,
        name: form.name,
        surname: form.surname,
        city: form.city,
        phone: form.phone,
        verificationToken: token || undefined,
        password: form.password,
      });
      router.push(`/auth/login?registered=1${returnQuery(returnTo, "&")}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const strong = isStrongPassword(form.password);
  const mismatch = !!form.confirm && form.confirm !== form.password;
  // Same pill shape as the login form.
  const input = "h-12 w-full rounded-full bg-muted px-5 text-[15px] text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-accent";
  return (
    <main className="bg-background px-4 py-10 text-foreground md:py-14">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-6 shadow-card sm:p-10">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">{tr("Create account", "Sukurti paskyrą", "Создать аккаунт")}</h1>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="E-mail">
            <input className={input} type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={tr("First name", "Vardas", "Имя")}>
            <input className={input} autoComplete="given-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={tr("Last name", "Pavardė", "Фамилия")}>
            <input className={input} autoComplete="family-name" required value={form.surname} onChange={(e) => set("surname", e.target.value)} />
          </Field>
          <Field label={tr("City", "Miestas", "Город")}>
            <input className={input} autoComplete="address-level2" required value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <div className="rounded-3xl bg-muted p-5 md:col-span-2">
            <span className="mb-2 block px-1 font-bold">{tr("Phone", "Telefonas", "Телефон")}</span>
            <PhoneVerificationBox
              phone={form.phone}
              verified={!!token}
              inputClassName={input}
              pill
              onPhoneChange={(value) => {
                set("phone", value);
                if (value !== form.phone) setToken("");
              }}
              onVerified={(verificationToken, normalizedPhone) => {
                set("phone", normalizedPhone);
                setToken(verificationToken);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Field label={tr("Password", "Slaptažodis", "Пароль")}>
              <PasswordInput className={input} autoComplete="new-password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
            </Field>
            <PasswordStrength password={form.password} />
          </div>
          <div className="md:col-span-2">
            <Field label={tr("Confirm password", "Pakartokite slaptažodį", "Повторите пароль")}>
              <PasswordInput className={input} autoComplete="new-password" required value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
            </Field>
            {mismatch && <p className="mt-2 px-1 text-sm text-red-500">{tr("Passwords do not match", "Slaptažodžiai nesutampa", "Пароли не совпадают")}</p>}
          </div>
          <label className="flex gap-3 text-sm leading-6 md:col-span-2">
            <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--accent))]" />
            <span>
              {tr("I am at least 18 years old and agree to the ", "Man yra bent 18 metų ir sutinku su ", "Мне есть 18 лет, и я принимаю ")}
              <Link href="/rules" target="_blank" className="font-semibold underline">{tr("Rules", "Taisyklėmis", "Правила")}</Link>
              {tr(". I have read the ", ". Susipažinau su ", ". Я ознакомился(-ась) с ")}
              <Link href="/privacy" target="_blank" className="font-semibold underline">{tr("Privacy policy", "Privatumo politika", "Политикой конфиденциальности")}</Link>
              .
            </span>
          </label>
          {error && <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 md:col-span-2">{error}</div>}
          <button
            disabled={loading || !agreed || !strong || mismatch || (!token && !off)}
            className="h-14 rounded-full bg-accent text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {loading ? "…" : tr("Create account", "Sukurti paskyrą", "Создать аккаунт")}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">{tr("or", "arba", "или")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <a href={googleLoginUrl()} onClick={() => rememberReturnPath(returnTo)} className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border bg-card font-bold transition hover:bg-muted">
          <img src="/icons/google.svg" alt="" width={20} height={20} className="h-5 w-5" />
          {tr("Continue with Google", "Tęsti su Google", "Продолжить с Google")}
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tr(
            "By continuing with Google you confirm you are 18 or older, agree to the Rules and have read the Privacy policy. ",
            "Tęsdami su Google patvirtinate, kad jums yra bent 18 metų, sutinkate su Taisyklėmis ir susipažinote su Privatumo politika. ",
            "Продолжая с Google, вы подтверждаете, что вам есть 18 лет, принимаете Правила и ознакомились с Политикой конфиденциальности. "
          )}
          {tr(
            "Google accounts verify the phone number later, before publishing a listing.",
            "Google paskyroms telefonas patvirtinamas vėliau, prieš paskelbiant skelbimą.",
            "Для аккаунтов Google телефон подтверждается позже, перед публикацией объявления."
          )}
        </p>
        <Link href={`/auth/login${returnQuery(returnTo)}`} className="mt-5 block text-center font-semibold hover:text-accent-ink">
          {tr("Already have an account?", "Jau turite paskyrą?", "Уже есть аккаунт?")}
        </Link>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block px-1 font-bold">{label}</span>
      {children}
    </label>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<main className="min-h-[72vh]" />}><RegisterInner /></Suspense>;
}
