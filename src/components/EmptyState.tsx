import React from "react";

export default function EmptyState({
  title = "No results",
  subtitle = "Try changing the filters.",
}: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" className="mb-4 text-[hsl(var(--muted-foreground))]">
        <path d="M4 6H20M6 12H18M10 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
    </div>
  );
}
