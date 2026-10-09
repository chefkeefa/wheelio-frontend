"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import SellDraftCard from "@/components/SellDraftCard";
import { ApiError } from "@/lib/http";
import { changeEmail, changePassword, deleteOwnAccount, isAdminUser, me, requestEmailVerification, updateProfile, type AuthUser } from "@/lib/pirkApi";
import { usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";
import PasswordInput from "@/components/ui/PasswordInput";

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
                <p className="text-xs text-muted-foreground">{tr("For the certified profile tick, write your name in English letters starting with a capital, e.g. Piotr Kowalski.", "Sertifikuoto profilio varnelei vardą rašykite angliškomis raidėmis iš didžiosios raidės, pvz., Piotr Kowalski.", "Для галочки сертифицированного профиля пишите имя английскими буквами с заглавной, например Piotr Kowalski.")}</p>
                <label className="block text-sm font-semibold">{tr("City", "Miestas", "Город")}<input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                {message && <p className="text-sm text-emerald-700">{message}</p>}{error && <p className="text-sm text-red-600">{error}</p>}
                <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{saving ? "…" : tr("Save changes", "Išsaugoti", "Сохранить")}</button>
              </form>
              <Info label="E-mail" value={user.email} />
              <EmailStatus verified={user.emailVerified} tr={tr} />
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
            {!isAdminUser(user) && <DeleteAccountSection user={user} tr={tr} />}
          </div>
        )}
      </div>
    </main>
  );
}

/** Confirmation state of the account's e-mail; nothing is shown while confirmation is off on the backend. */
function EmailStatus({ verified, tr }: { verified: boolean | null | undefined; tr: (en: string, lt: string, ru: string) => string }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  if (verified === null || verified === undefined) return null;
  if (verified) return <div className="mt-2 text-sm font-semibold text-emerald-600">{tr("E-mail confirmed", "El. paštas patvirtintas", "E-mail подтверждён")}</div>;
  const send = async () => {
    setBusy(true); setNote("");
    try {
      const r = await requestEmailVerification();
      setNote(r.alreadyVerified
        ? tr("Already confirmed. Reload the page.", "Jau patvirtinta. Perkraukite puslapį.", "Уже подтверждён. Обновите страницу.")
        : tr("Link sent. Check your inbox (and spam).", "Nuoroda išsiųsta. Patikrinkite paštą (ir šlamštą).", "Ссылка отправлена. Проверьте почту (и спам)."));
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 rounded-xl bg-amber-500/10 p-4">
      <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">{tr("E-mail not confirmed: confirm it to publish listings.", "El. paštas nepatvirtintas: patvirtinkite, kad galėtumėte skelbti.", "E-mail не подтверждён: подтвердите его, чтобы публиковать объявления.")}</div>
      <button type="button" disabled={busy} onClick={send} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy ? "…" : tr("Send confirmation link", "Siųsti patvirtinimo nuorodą", "Отправить ссылку")}</button>
      {note && <p className="mt-2 text-sm">{note}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mt-4 border-b border-border pb-3"><div className="text-xs font-semibold text-muted-foreground">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

/** GDPR self-service: erases the account, its listings and personal data after typing the e-mail (and password). */
function DeleteAccountSection({ user, tr }: { user: AuthUser; tr: (en: string, lt: string, ru: string) => string }) {
  const hasPassword = (user.authProvider || "PASSWORD").toUpperCase() !== "GOOGLE";
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await deleteOwnAccount(confirmEmail.trim(), hasPassword ? password : undefined);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not delete the account.", "Nepavyko ištrinti paskyros.", "Не удалось удалить аккаунт."));
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-red-500/30 bg-card p-6 md:col-span-2">
      <h2 className="text-xl font-bold">{tr("Delete account", "Ištrinti paskyrą", "Удалить аккаунт")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{tr(
        "Your listings, photos and personal data are deleted for good. This cannot be undone.",
        "Jūsų skelbimai, nuotraukos ir asmens duomenys bus ištrinti visam laikui. To atšaukti negalima.",
        "Ваши объявления, фото и личные данные будут удалены навсегда. Отменить это нельзя."
      )}</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-4 rounded-lg border border-red-500/50 px-4 py-2 font-semibold text-red-600">{tr("Delete my account", "Ištrinti mano paskyrą", "Удалить мой аккаунт")}</button>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:max-w-md">
          <label className="block text-sm font-semibold">{tr("Type your e-mail to confirm", "Įveskite savo el. paštą patvirtinimui", "Введите свой e-mail для подтверждения")}
            <input type="email" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user.email} className="mt-1 h-11 w-full rounded-lg bg-muted px-3 ring-1 ring-inset ring-border outline-none focus:ring-2 focus:ring-accent" />
          </label>
          {hasPassword && (
            <label className="block text-sm font-semibold">{tr("Password", "Slaptažodis", "Пароль")}
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg bg-muted px-3 ring-1 ring-inset ring-border outline-none focus:ring-2 focus:ring-accent" />
            </label>
          )}
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
          <div className="flex gap-3">
            <button disabled={busy || confirmEmail.trim().toLowerCase() !== String(user.email).toLowerCase()} className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? "…" : tr("Delete for good", "Ištrinti visam laikui", "Удалить навсегда")}</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="rounded-lg border border-border px-4 py-2 font-semibold">{tr("Cancel", "Atšaukti", "Отмена")}</button>
          </div>
        </form>
      )}
    </section>
  );
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
      const result = await changeEmail(next, hasPassword ? emailPassword : undefined);
      setEmail(""); setEmailPassword("");
      if (result.pending) {
        // The address changes only after the link sent to it is opened.
        setMessage(tr(
          `We sent a confirmation link to ${next}. Your e-mail changes after you open it.`,
          `Išsiuntėme patvirtinimo nuorodą į ${next}. El. paštas pasikeis, kai ją atidarysite.`,
          `Мы отправили ссылку на ${next}. E-mail изменится после того, как вы её откроете.`
        ));
      } else {
        onEmailChanged(next);
        setMessage(tr("E-mail changed.", "El. paštas pakeistas.", "E-mail изменён."));
      }
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
            <label className="block text-sm font-semibold">{tr("Current password", "Dabartinis slaptažodis", "Текущий пароль")}<PasswordInput required autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={input} /></label>
            <label className="block text-sm font-semibold">{tr("New password", "Naujas slaptažodis", "Новый пароль")}<PasswordInput required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input} /></label>
            <label className="block text-sm font-semibold">{tr("Repeat new password", "Pakartokite naują slaptažodį", "Повторите новый пароль")}<PasswordInput required minLength={8} autoComplete="new-password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className={input} /></label>
            <button disabled={busy === "password"} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{busy === "password" ? "…" : tr("Change password", "Keisti slaptažodį", "Сменить пароль")}</button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{tr("You sign in with Google, so there is no password to change.", "Jungiatės per Google, todėl slaptažodžio keisti nereikia.", "Вы входите через Google, поэтому пароль менять не нужно.")}</p>
        )}
        <form onSubmit={submitEmail} className="space-y-3">
          <div className="font-semibold">{tr("Change e-mail", "Keisti el. paštą", "Сменить e-mail")}</div>
          <label className="block text-sm font-semibold">{tr("New e-mail", "Naujas el. paštas", "Новый e-mail")}<input type="email" required maxLength={190} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
          {hasPassword && <label className="block text-sm font-semibold">{tr("Current password", "Dabartinis slaptažodis", "Текущий пароль")}<PasswordInput required autoComplete="current-password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className={input} /></label>}
          <button disabled={busy === "email"} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground disabled:opacity-60">{busy === "email" ? "…" : tr("Change e-mail", "Keisti el. paštą", "Сменить e-mail")}</button>
        </form>
      </div>
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
