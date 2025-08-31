import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl ring-1 ring-[hsl(var(--border))]">
      <div className="h-56 w-full bg-[hsl(var(--muted))]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-3/4 rounded bg-[hsl(var(--muted))]" />
        <div className="h-3 w-1/2 rounded bg-[hsl(var(--muted))]" />
      </div>
    </div>
  );
}
