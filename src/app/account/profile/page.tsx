"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import SellDraftCard from "@/components/SellDraftCard";
import { ApiError } from "@/lib/http";
import { changeEmail, changePassword, me, updateProfile, type AuthUser } from "@/lib/pirkApi";
import { usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";

export default function ProfilePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;
  const [user, setUser] = useState<AuthUser | null>(null);
  const phoneOff = verificationOff(usePhoneVerificationConfig());
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    me().then((value) => {
      setUser(value);
      setName(value.name || "");
      setSurname(value.surname || "");
      setCity(value.city || "");
    }).catch((e) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) router.replace("/auth/login?return=/account/profile");
    }).finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      await updateProfile({ name: name.trim(), surname: surname.trim(), city: city.trim() });
      setUser({ ...user, name: name.trim(), surname: surname.trim(), city: city.trim() });
      setMessage(tr("Profile saved.", "Profilis išsaugotas.", "Профиль сохранён."));
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Could not save profile.", "Nepavyko išsaugoti profilio.", "Не удалось сохранить профиль."));
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <h1 className="page-title">{tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки")}</h1>
        {loading ? <div className="mt-8 h-72 animate-pulse rounded-2xl bg-muted" /> : user && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <SellDraftCard className="md:col-span-2" />
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{tr("Account", "Paskyra", "Аккаунт")}</h2>
              <form onSubmit={save} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold">{tr("First name", "Vardas", "Имя")}<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                <label className="block text-sm font-semibold">{tr("Last name", "Pavardė", "Фамилия")}<input required value={surname} onChange={(e) => setSurname(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                <label className="block text-sm font-semibold">{tr("City", "Miestas", "Город")}<input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                {message && <p className="text-sm text-emerald-700">{message}</p>}{error && <p className="text-sm text-red-600">{error}</p>}
                <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{saving ? "…" : tr("Save changes", "Išsaugoti", "Сохранить")}</button>
              </form>
              <Info label="E-mail" value={user.email} />
            </section>
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{tr("Security", "Saugumas", "Безопасность")}</h2>
              <Info label={tr("Phone", "Telefonas", "Телефон")} value={user.phone || "—"} />
              {phoneOff ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
                  <div className="font-bold">{user.phone ? tr("Change phone number", "Keisti telefono numerį", "Изменить номер телефона") : tr("Add a phone number to publish listings", "Pridėkite telefoną, kad galėtumėte skelbti", "Добавьте телефон, чтобы публиковать объявления")}</div>
                  <Link href="/verify-phone?return=/account/profile" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">{user.phone ? tr("Change", "Keisti", "Изменить") : tr("Add", "Pridėti", "Добавить")}</Link>
                </div>
              ) : (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
                <div>
                  <div className="font-bold">{tr("Phone verification", "Telefono patvirtinimas", "Подтверждение телефона")}</div>
                  <div className={`mt-1 text-sm font-semibold ${user.phoneVerified ? "text-emerald-600" : "text-amber-600"}`}>{user.phoneVerified ? tr("Verified", "Patvirtintas", "Подтверждён") : tr("Not verified", "Nepatvirtintas", "Не подтверждён")}</div>
                </div>
                {!user.phoneVerified && <Link href="/verify-phone?return=/account/profile" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">{tr("Verify", "Patvirtinti", "Подтвердить")}</Link>}
              </div>
              )}
            </section>
            <CredentialsSection user={user} tr={tr} onEmailChanged={(email) => setUser({ ...user, email })} />
            <Link href="/account/favorites" className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent"><div className="text-xl font-bold">{tr("Favorites", "Mėgstami", "Избранное")}</div><p className="mt-2 text-muted-foreground">{tr("Cars you saved.", "Išsaugoti automobiliai.", "Сохранённые автомобили.")}</p></Link>
            <Link href="/account/listings" className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent"><div className="text-xl font-bold">{tr("My listings", "Mano skelbimai", "Мои объявления")}</div><p className="mt-2 text-muted-foreground">{tr("View and manage the cars you are selling.", "Peržiūrėkite ir valdykite parduodamus automobilius.", "Просматривайте и управляйте продаваемыми автомобилями.")}</p></Link>
            <Link href="/help" className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent"><div className="text-xl font-bold">{tr("Help & support", "Pagalba", "Помощь и поддержка")}</div><p className="mt-2 text-muted-foreground">{tr("Open live support or send a support request.", "Atidarykite tiesioginę pagalbą arba siųskite užklausą.", "Откройте онлайн-поддержку или отправьте обращение.")}</p></Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mt-4 border-b border-border pb-3"><div className="text-xs font-semibold text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function CredentialsSection({
  user,
  tr,
  onEmailChanged,
}: {
  user: AuthUser;
  tr: (en: string, lt: string, ru: string) => string;
  onEmailChanged: (email: string) => void;
}) {
  // Google accounts have no password; older backends do not send authProvider (treated as password accounts).
  const hasPassword = (user.authProvider || "PASSWORD").toUpperCase() !== "GOOGLE";
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [busy, setBusy] = useState<"password" | "email" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(""); setError("");
    if (newPassword !== repeatPassword) {
      setError(tr("New passwords do not match.", "Nauji slaptažodžiai nesutampa.", "Новые пароли не совпадают."));
      return;
    }
    setBusy("password");
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword(""); setNewPassword(""); setRepeatPassword("");
      setMessage(tr("Password changed. Other devices were signed out.", "Slaptažodis pakeistas. Kiti įrenginiai atjungti.", "Пароль изменён. Другие устройства вышли из аккаунта."));
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not change the password.", "Nepavyko pakeisti slaptažodžio.", "Не удалось изменить пароль."));
    } finally { setBusy(null); }
  };

  const submitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(""); setError("");
    setBusy("email");
    try {
      const next = email.trim().toLowerCase();
      await changeEmail(next, hasPassword ? emailPassword : undefined);
      onEmailChanged(next);
      setEmail(""); setEmailPassword("");
      setMessage(tr("E-mail changed.", "El. paštas pakeistas.", "E-mail изменён."));
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not change the e-mail.", "Nepavyko pakeisti el. pašto.", "Не удалось изменить e-mail."));
    } finally { setBusy(null); }
  };

  const input = "mt-1 h-11 w-full rounded-lg border border-border bg-background px-3";
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
      <h2 className="text-xl font-bold">{tr("Login details", "Prisijungimo duomenys", "Данные для входа")}</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {hasPassword ? (
          <form onSubmit={submitPassword} className="space-y-3">
            <div className="font-semibold">{tr("Change password", "Keisti slaptažodį", "Сменить пароль")}</div>
            <label className="block text-sm font-semibold">{tr("Current password", "Dabartinis slaptažodis", "Текущий пароль")}<input type="password" required autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={input} /></label>
            <label className="block text-sm font-semibold">{tr("New password", "Naujas slaptažodis", "Новый пароль")}<input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input} /></label>
            <label className="block text-sm font-semibold">{tr("Repeat new password", "Pakartokite naują slaptažodį", "Повторите новый пароль")}<input type="password" required minLength={8} autoComplete="new-password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className={input} /></label>
            <button disabled={busy === "password"} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{busy === "password" ? "…" : tr("Change password", "Keisti slaptažodį", "Сменить пароль")}</button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{tr("You sign in with Google, so there is no password to change.", "Jungiatės per Google, todėl slaptažodžio keisti nereikia.", "Вы входите через Google, поэтому пароль менять не нужно.")}</p>
        )}
        <form onSubmit={submitEmail} className="space-y-3">
          <div className="font-semibold">{tr("Change e-mail", "Keisti el. paštą", "Сменить e-mail")}</div>
          <label className="block text-sm font-semibold">{tr("New e-mail", "Naujas el. paštas", "Новый e-mail")}<input type="email" required maxLength={190} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
          {hasPassword && <label className="block text-sm font-semibold">{tr("Current password", "Dabartinis slaptažodis", "Текущий пароль")}<input type="password" required autoComplete="current-password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className={input} /></label>}
          <button disabled={busy === "email"} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{busy === "email" ? "…" : tr("Change e-mail", "Keisti el. paštą", "Сменить e-mail")}</button>
        </form>
      </div>
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
