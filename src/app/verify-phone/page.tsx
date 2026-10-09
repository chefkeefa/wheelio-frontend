"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import PhoneVerificationBox from "@/components/PhoneVerificationBox";
import { attachVerifiedPhone, takenContactError } from "@/lib/pirkApi";
import { usePhoneVerificationConfig, verificationOff } from "@/lib/usePhoneVerification";
import { safeReturnPath } from "@/lib/safeReturn";


function VerifyPhonePageInner() {
  const { tr } = useLanguage();
  const search = useSearchParams();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const off = verificationOff(usePhoneVerificationConfig());

  async function attach(verificationToken: string, normalizedPhone: string) {
    try {
      await attachVerifiedPhone(normalizedPhone, verificationToken);
    } catch (e) {
      if (takenContactError(e) === "PHONE_TAKEN")
        throw new Error(
          tr(
            "This number already belongs to another Wheelio account. One number can be used by one account only.",
            "Šis numeris jau priklauso kitai Wheelio paskyrai. Vieną numerį gali naudoti tik viena paskyra.",
            "Этот номер уже привязан к другому аккаунту Wheelio. Один номер можно использовать только в одном аккаунте."
          )
        );
      throw e;
    }
    setVerified(true);
    setTimeout(() => router.replace(safeReturnPath(search.get("return"))), 700);
  }

  return (
    <main className="page min-h-[60vh] text-foreground">
      <div className="mx-auto max-w-md rounded-2xl bg-card p-6 shadow-card ring-1 ring-border sm:p-10">
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">{off ? tr("Add phone", "Pridėti telefoną", "Добавить телефон") : tr("Verify phone", "Patvirtinti telefoną", "Подтвердить телефон")}</h1>
        <p className="mb-5 text-muted-foreground">
          {off
            ? tr(
                "A phone number is required before publishing a listing. Buyers will see it in your listings.",
                "Prieš paskelbiant skelbimą reikia nurodyti telefono numerį. Pirkėjai jį matys jūsų skelbimuose.",
                "Перед публикацией объявления нужно указать номер телефона. Покупатели увидят его в ваших объявлениях."
              )
            : tr(
                "A verified phone number is required before publishing a listing.",
                "Prieš paskelbiant skelbimą reikia patvirtinti telefono numerį.",
                "Перед публикацией объявления нужно подтвердить номер телефона."
              )}
        </p>
        <PhoneVerificationBox phone={phone} onPhoneChange={setPhone} onVerified={attach} verified={verified} saveWhenOff />
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
