"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { getPasswordResetConfig, requestPasswordReset } from "@/lib/pirkApi";

type Availability = "loading" | "enabled" | "unavailable";

export default function ForgotPasswordPage() {
  const { tr } = useLanguage();
  const [availability, setAvailability] = useState<Availability>("loading");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getPasswordResetConfig()
      .then((c) => alive && setAvailability(c.enabled ? "enabled" : "unavailable"))
      .catch(() => alive && setAvailability("unavailable"));
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) setAvailability("unavailable");
      else if (err instanceof ApiError && err.status === 429)
        setError(tr("Too many requests. Please try again later.", "Per daug užklausų. Bandykite vėliau.", "Слишком много запросов. Попробуйте позже."));
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-xl rounded-2xl border-2 border-accent bg-card p-8">
        <h1 className="mb-3 text-4xl font-bold">{tr("Reset password", "Atkurti slaptažodį", "Восстановить пароль")}</h1>

        {availability === "loading" && <p className="text-muted-foreground">…</p>}

        {availability === "unavailable" && (
          <div className="rounded-lg bg-amber-500/10 p-4 text-amber-700" role="status">
            <p className="font-semibold">
              {tr("Password reset by e-mail is currently unavailable.", "Slaptažodžio atkūrimas el. paštu šiuo metu neveikia.", "Восстановление пароля по e-mail сейчас недоступно.")}
            </p>
            <p className="mt-1 text-sm">
              {tr(
                "No e-mail will be sent. Please contact support and we will help you regain access.",
                "Laiškas nebus išsiųstas. Susisiekite su pagalba – padėsime atgauti prieigą.",
                "Письмо отправлено не будет. Обратитесь в поддержку — мы поможем восстановить доступ."
              )}
            </p>
            <Link href="/help" className="mt-3 inline-block font-bold underline">
              {tr("Contact support", "Susisiekti su pagalba", "Связаться с поддержкой")}
            </Link>
          </div>
        )}

        {availability === "enabled" && !sent && (
          <form onSubmit={submit}>
            <p className="mb-6 text-muted-foreground">
              {tr(
                "Enter the e-mail of your account. If it is registered, you will receive a link to set a new password.",
                "Įveskite paskyros el. paštą. Jei jis užregistruotas, gausite nuorodą naujam slaptažodžiui nustatyti.",
                "Введите e-mail аккаунта. Если он зарегистрирован, вы получите ссылку для установки нового пароля."
              )}
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              placeholder="someone@example.com"
              className="mb-4 h-12 w-full rounded-lg bg-[#cecece] px-4 text-black outline-none focus:ring-2 focus:ring-accent"
            />
            {error && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
            <button disabled={sending || !email.trim()} className="h-12 w-full rounded-lg bg-[#5f5f5f] font-semibold text-white hover:bg-accent disabled:opacity-50">
              {sending ? "…" : tr("Send reset link", "Siųsti atkūrimo nuorodą", "Отправить ссылку")}
            </button>
          </form>
        )}

        {availability === "enabled" && sent && (
          <div className="rounded-lg bg-green-500/10 p-4 text-green-700" role="status">
            {tr(
              "If an account with this e-mail exists, we have sent a reset link. Check your inbox and spam folder; the link expires soon.",
              "Jei paskyra su šiuo el. paštu egzistuoja, išsiuntėme atkūrimo nuorodą. Patikrinkite gautus laiškus ir šlamšto aplanką; nuoroda netrukus nustos galioti.",
              "Если аккаунт с этим e-mail существует, мы отправили ссылку для восстановления. Проверьте входящие и спам; ссылка скоро перестанет действовать."
            )}
          </div>
        )}

        <Link href="/auth/login" className="mt-5 block text-center font-semibold text-foreground hover:text-accent">
          {tr("Back to login", "Grįžti į prisijungimą", "Вернуться ко входу")}
        </Link>
      </div>
    </main>
  );
}
