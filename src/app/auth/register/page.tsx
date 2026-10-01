"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import PhoneVerificationBox from "@/components/PhoneVerificationBox";
import { googleLoginUrl, registerUser } from "@/lib/pirkApi";
import { usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";

export default function RegisterPage() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", surname: "", city: "", address: "", zip: "", phone: "", password: "", confirm: "" });
  const [token, setToken] = useState("");
  const off = verificationOff(usePhoneVerificationConfig());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
        address: form.address,
        zip: form.zip,
        phone: form.phone,
        verificationToken: token || undefined,
        password: form.password,
      });
      router.push("/auth/login?registered=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const input = "h-11 w-full rounded-lg bg-[#cecece] px-3 text-black outline-none focus:ring-2 focus:ring-accent";
  return (
    <main className="bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-accent bg-card p-7">
        <h1 className="mb-6 text-center text-5xl font-bold">{tr("Create account", "Sukurti paskyrą", "Создать аккаунт")}</h1>
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
          <Field label={tr("Address", "Adresas", "Адрес")}>
            <input className={input} autoComplete="street-address" required value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label={tr("Post code", "Pašto kodas", "Почтовый индекс")}>
            <input className={input} autoComplete="postal-code" required value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </Field>
          <div className="rounded-xl bg-muted p-4 md:col-span-2">
            <span className="mb-2 block font-bold">{tr("Phone", "Telefonas", "Телефон")}</span>
            <PhoneVerificationBox
              phone={form.phone}
              verified={!!token}
              inputClassName={input}
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
          <Field label={tr("Password", "Slaptažodis", "Пароль")}>
            <input className={input} type="password" autoComplete="new-password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>
          <Field label={tr("Confirm password", "Pakartokite slaptažodį", "Повторите пароль")}>
            <input className={input} type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
          </Field>
          <p className="text-sm text-muted-foreground md:col-span-2">
            {tr(
              "At least 8 characters with an uppercase letter, a number and a symbol.",
              "Bent 8 simboliai: didžioji raidė, skaičius ir specialusis simbolis.",
              "Минимум 8 символов: заглавная буква, цифра и спецсимвол."
            )}
          </p>
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-red-600 md:col-span-2">{error}</div>}
          <button disabled={loading || (!token && !off)} className="h-12 rounded-lg bg-[#5f5f5f] font-bold text-white hover:bg-accent disabled:opacity-50 md:col-span-2">
            {loading ? "…" : tr("Create account", "Sukurti paskyrą", "Создать аккаунт")}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">{tr("or", "arba", "или")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <a href={googleLoginUrl()} className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background font-bold transition hover:bg-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-black text-[#4285F4]">G</span>
          {tr("Continue with Google", "Tęsti su Google", "Продолжить с Google")}
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tr(
            "Google accounts verify the phone number later, before publishing a listing.",
            "Google paskyroms telefonas patvirtinamas vėliau, prieš paskelbiant skelbimą.",
            "Для аккаунтов Google телефон подтверждается позже, перед публикацией объявления."
          )}
        </p>
        <Link href="/auth/login" className="mt-5 block text-center font-semibold hover:text-accent">
          {tr("Already have an account?", "Jau turite paskyrą?", "Уже есть аккаунт?")}
        </Link>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold">{label}</span>
      {children}
    </label>
  );
}
