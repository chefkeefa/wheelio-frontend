"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";

/** "Back to top" button in the bottom-left corner, shown after scrolling down (the support chat sits bottom-right). */
export default function ScrollTopButton() {
  const { tr } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={tr("Back to top", "Į viršų", "Наверх")}
      title={tr("Back to top", "Į viršų", "Наверх")}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[80] grid h-12 w-12 place-items-center rounded-xl bg-card text-foreground shadow-lg ring-1 ring-border transition hover:text-accent-ink sm:bottom-6 sm:left-6"
    >
      <AssetIcon name="arrow-up" size={22} />
    </button>
  );
}
