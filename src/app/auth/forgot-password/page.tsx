"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;
  const [email, setEmail] = useState("");

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-xl rounded-2xl border-2 border-accent bg-card p-8">
        <h1 className="mb-3 text-4xl font-bold">{tr("Reset password", "Atkurti slaptažodį", "Восстановить пароль")}</h1>
        <p className="mb-6 text-muted-foreground">{tr("Enter your e-mail. Password reset will be connected to the backend later.", "Įveskite el. paštą. Slaptažodžio atkūrimas bus prijungtas prie serverio vėliau.", "Введите e-mail. Восстановление пароля будет подключено к серверу позже.")}</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="someone@example.com" className="mb-4 h-12 w-full rounded-lg bg-[#cecece] px-4 text-black outline-none focus:ring-2 focus:ring-accent" />
        <button onClick={() => alert(tr("Reset request demo.", "Atkūrimo užklausos demonstracija.", "Демо запроса на восстановление."))} className="h-12 w-full rounded-lg bg-[#5f5f5f] font-semibold text-white hover:bg-accent">{tr("Send reset link", "Siųsti atkūrimo nuorodą", "Отправить ссылку")}</button>
        <Link href="/auth/login" className="mt-5 block text-center font-semibold text-foreground hover:text-accent">{tr("Back to login", "Grįžti į prisijungimą", "Вернуться ко входу")}</Link>
      </div>
    </main>
  );
}
