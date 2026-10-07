"use client";

import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";

/**
 * Identity status next to a user's name: a green tick when Wheelio has checked the person's ID, a grey one when
 * not. Hovering (or tapping, which focuses it) shows what it means.
 */
export default function VerifiedBadge({ verified, size = 22 }: { verified: boolean; size?: number }) {
  const { tr } = useLanguage();
  const label = verified
    ? tr("Identity verified", "Tapatybė patvirtinta", "Личность подтверждена")
    : tr("Identity not verified", "Tapatybė nepatvirtinta", "Личность не подтверждена");
  return (
    <span tabIndex={0} aria-label={label} className="group relative inline-flex shrink-0 align-middle outline-none">
      <span
        style={{ width: size, height: size }}
        className={`grid place-items-center rounded-full text-white ring-2 ring-card transition group-focus-visible:ring-accent ${
          verified ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
        }`}
      >
        <AssetIcon name="check" size={Math.round(size * 0.62)} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
