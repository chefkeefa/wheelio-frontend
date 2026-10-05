"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { reportClientError } from "@/lib/pirkApi";

// Shown instead of a blank "Application error" page when a page crashes. The error is reported to the
// backend, where it appears in the admin panel (Diagnostics → recent errors).
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { tr } = useLanguage();
  useEffect(() => {
    reportClientError(error);
  }, [error]);
  return (
    <main className="container mx-auto min-h-[60vh] px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold">{tr("Something went wrong", "Kažkas nepavyko", "Что-то пошло не так")}</h1>
      <p className="mt-3 text-muted-foreground">
        {tr(
          "We have been notified. Try again, or come back a little later.",
          "Apie klaidą jau žinome. Bandykite dar kartą arba sugrįžkite šiek tiek vėliau.",
          "Мы уже знаем об ошибке. Попробуйте ещё раз или зайдите чуть позже."
        )}
      </p>
      <button onClick={reset} className="mt-6 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-foreground">
        {tr("Try again", "Bandyti dar kartą", "Попробовать снова")}
      </button>
    </main>
  );
}
