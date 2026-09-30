/* eslint-disable @next/next/no-img-element */
import React from "react";

export default function EmptyState({
  title = "No results",
  subtitle = "Try changing the filters.",
}: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center">
      <img src="/icons/empty.svg" alt="" className="mb-4 h-12 w-12 opacity-50" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
    </div>
  );
}
