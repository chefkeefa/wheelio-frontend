"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function LegacyListingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const id = String(searchParams.get("id") ?? "").trim();

  const tr = (en: string, lt: string, ru: string) =>
    language === "LT" ? lt : language === "RU" ? ru : en;

  useEffect(() => {
    if (/^\d+$/.test(id)) {
      router.replace(`/listing/${encodeURIComponent(id)}`);
    }
  }, [id, router]);

  if (/^\d+$/.test(id)) {
    return (
      <main className="container mx-auto min-h-[55vh] px-4 py-10 text-foreground">
        {tr("Opening listing...", "Atidaromas skelbimas...", "Открываем объявление...")}
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-[55vh] px-4 py-10 text-foreground">
      <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 ring-1 ring-border">
        <h1 className="text-2xl font-bold">
          {tr("Invalid listing link", "Neteisinga skelbimo nuoroda", "Неверная ссылка на объявление")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {tr(
            "Open the listing again from the home page.",
            "Atidarykite skelbimą dar kartą iš pagrindinio puslapio.",
            "Откройте объявление заново с главной страницы."
          )}
        </p>
      </div>
    </main>
  );
}

export default function LegacyListingPage() { return <Suspense fallback={<main className="min-h-[55vh]" />}><LegacyListingPageInner /></Suspense>; }
