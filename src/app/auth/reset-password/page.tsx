"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { confirmPasswordReset, getPasswordResetConfig } from "@/lib/pirkApi";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { isStrongPassword } from "@/lib/passwordPolicy";

function ResetPasswordInner() {
  const { tr } = useLanguage();
  const search = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Read the one-time token once, then remove it from the address bar and browser history.
  useEffect(() => {
    const value = search.get("token");
    if (value) {
      setToken(value);
      window.history.replaceState(null, "", window.location.pathname);
    } else setToken((current) => current ?? "");
  }, [search]);

  useEffect(() => {
    let alive = true;
    getPasswordResetConfig()
      .then((c) => alive && setEnabled(c.enabled))
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(tr("Passwords do not match", "Slaptažodžiai nesutampa", "Пароли не совпадают"));
      return;
    }
    setSaving(true);
    try {
      await confirmPasswordReset(token || "", password, confirm);
      setDone(true);
      setTimeout(() => router.replace("/auth/login?reset=1"), 1500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) setEnabled(false);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const input = "h-12 w-full rounded-lg bg-muted px-4 text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent";
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">{tr("Set a new password", "Naujas slaptažodis", "Новый пароль")}</h1>

        {(enabled === null || token === null) && <p className="text-muted-foreground">…</p>}

        {enabled === false && (
          <div className="rounded-lg bg-amber-500/10 p-4 text-amber-700" role="status">
            {tr(
              "Password reset is currently unavailable. Please contact support.",
              "Slaptažodžio atkūrimas šiuo metu neveikia. Susisiekite su pagalba.",
              "Восстановление пароля сейчас недоступно. Обратитесь в поддержку."
            )}
          </div>
        )}

        {enabled && token === "" && (
          <div className="rounded-lg bg-red-500/10 p-4 text-red-600">
            {tr("The reset link is incomplete. Request a new one.", "Atkūrimo nuoroda neišsami. Užsakykite naują.", "Ссылка неполная. Запросите новую.")}
            <Link href="/auth/forgot-password" className="mt-2 block font-bold underline">
              {tr("Request a new link", "Gauti naują nuorodą", "Получить новую ссылку")}
            </Link>
          </div>
        )}

        {enabled && !!token && !done && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block font-bold">{tr("New password", "Naujas slaptažodis", "Новый пароль")}</span>
              <PasswordInput className={input} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <PasswordStrength password={password} />
            <label className="block">
              <span className="mb-1 block font-bold">{tr("Confirm new password", "Pakartokite naują slaptažodį", "Повторите новый пароль")}</span>
              <PasswordInput className={input} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <p className="text-sm text-muted-foreground">
              {tr(
                "You will be signed out on other devices.",
                "Kituose įrenginiuose būsite atjungti.",
                "На других устройствах сеанс будет завершён."
              )}
            </p>
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
                {error}
                <Link href="/auth/forgot-password" className="mt-1 block font-bold underline">
                  {tr("Request a new link", "Gauti naują nuorodą", "Получить новую ссылку")}
                </Link>
              </div>
            )}
            <button disabled={saving || !isStrongPassword(password) || !confirm} className="h-12 w-full rounded-lg bg-primary font-bold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
              {saving ? "…" : tr("Save password", "Išsaugoti slaptažodį", "Сохранить пароль")}
            </button>
          </form>
        )}

        {done && (
          <div className="rounded-lg bg-green-500/10 p-4 text-green-700" role="status">
            {tr("Password changed. Redirecting to login…", "Slaptažodis pakeistas. Nukreipiame į prisijungimą…", "Пароль изменён. Переходим ко входу…")}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-[70vh]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
