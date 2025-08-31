// src/app/listing/layout.tsx
import { Suspense, ReactNode } from "react";

export default function ListingLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      {children}
    </Suspense>
  );
}
