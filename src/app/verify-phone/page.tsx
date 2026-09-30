"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import PhoneVerificationBox from "@/components/PhoneVerificationBox";
import { attachVerifiedPhone } from "@/lib/pirkApi";

/** Only same-site relative paths are accepted as a return target (no open redirects). */
function safeReturnPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}

function VerifyPhonePageInner() {
  const { tr } = useLanguage();
  const search = useSearchParams();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);

  async function attach(verificationToken: string, normalizedPhone: string) {
    await attachVerifiedPhone(normalizedPhone, verificationToken);
    setVerified(true);
    setTimeout(() => router.replace(safeReturnPath(search.get("return"))), 700);
  }

  return (
    <main className="container min-h-[60vh] py-12 text-foreground">
      <div className="mx-auto max-w-xl rounded-2xl bg-card p-7 ring-1 ring-border">
        <h1 className="mb-3 text-4xl font-bold">{tr("Verify phone", "Patvirtinti telefoną", "Подтвердить телефон")}</h1>
        <p className="mb-5 text-muted-foreground">
          {tr(
            "A verified phone number is required before publishing a listing.",
            "Prieš paskelbiant skelbimą reikia patvirtinti telefono numerį.",
            "Перед публикацией объявления нужно подтвердить номер телефона."
          )}
        </p>
        <PhoneVerificationBox phone={phone} onPhoneChange={setPhone} onVerified={attach} verified={verified} />
      </div>
    </main>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <VerifyPhonePageInner />
    </Suspense>
  );
}
