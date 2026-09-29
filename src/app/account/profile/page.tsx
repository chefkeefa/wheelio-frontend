"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { me, updateProfile, type AuthUser } from "@/lib/pirkApi";

export default function ProfilePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;
  const [user, setUser] = useState<AuthUser | null>(null);
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
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-extrabold md:text-5xl">{tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки")}</h1>
        {loading ? <div className="mt-8 h-72 animate-pulse rounded-2xl bg-muted" /> : user && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{tr("Account", "Paskyra", "Аккаунт")}</h2>
              <form onSubmit={save} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold">{tr("First name", "Vardas", "Имя")}<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                <label className="block text-sm font-semibold">{tr("Last name", "Pavardė", "Фамилия")}<input required value={surname} onChange={(e) => setSurname(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                <label className="block text-sm font-semibold">{tr("City", "Miestas", "Город")}<input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3" /></label>
                {message && <p className="text-sm text-emerald-700">{message}</p>}{error && <p className="text-sm text-red-600">{error}</p>}
                <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-bold text-black disabled:opacity-60">{saving ? "…" : tr("Save changes", "Išsaugoti", "Сохранить")}</button>
              </form>
              <Info label="E-mail" value={user.email} />
            </section>
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold">{tr("Security", "Saugumas", "Безопасность")}</h2>
              <Info label={tr("Phone", "Telefonas", "Телефон")} value={user.phone || "—"} />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
                <div>
                  <div className="font-bold">{tr("Phone verification", "Telefono patvirtinimas", "Подтверждение телефона")}</div>
                  <div className={`mt-1 text-sm font-semibold ${user.phoneVerified ? "text-emerald-600" : "text-amber-600"}`}>{user.phoneVerified ? tr("Verified", "Patvirtintas", "Подтверждён") : tr("Not verified", "Nepatvirtintas", "Не подтверждён")}</div>
                </div>
                {!user.phoneVerified && <Link href="/verify-phone?return=/account/profile" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black">{tr("Verify", "Patvirtinti", "Подтвердить")}</Link>}
              </div>
            </section>
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
