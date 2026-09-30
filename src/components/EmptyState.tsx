import React from "react";
import AssetIcon from "@/components/ui/AssetIcon";

export default function EmptyState({
  title = "No results",
  subtitle = "Try changing the filters.",
}: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center">
      <AssetIcon name="filter" size={48} className="mb-4 text-[hsl(var(--muted-foreground))]" />
      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
    </div>
  );
}
