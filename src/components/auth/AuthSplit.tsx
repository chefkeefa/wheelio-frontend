import type { ReactNode } from "react";

/**
 * Two-block auth card: an abstract 2D shape composition on the left, the form on the right.
 * Below lg the left block is hidden and only the form shows.
 */
export default function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-background px-4 py-10 text-foreground lg:py-14">
      <div className="grid w-full max-w-sm lg:max-w-5xl lg:grid-cols-2 lg:gap-3 lg:rounded-[2rem] lg:bg-card lg:p-3 lg:shadow-card lg:ring-1 lg:ring-border">
        <div aria-hidden className="relative hidden min-h-[600px] overflow-hidden rounded-[1.5rem] bg-muted lg:block">
          <ShapeArt />
        </div>
        <div className="flex items-center justify-center lg:px-10 lg:py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </main>
  );
}

/** Flat shapes in the site palette; the dark shapes use the text colour, so they flip with the theme. */
function ShapeArt() {
  return (
    <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full text-foreground">
      <circle cx="300" cy="118" r="44" fill="none" stroke="#F58905" strokeWidth="22" />
      <circle cx="300" cy="118" r="10" fill="currentColor" />
      <circle cx="86" cy="140" r="13" fill="currentColor" />
      <rect x="44" y="262" width="58" height="58" rx="10" fill="#FBD3A0" transform="rotate(-14 73 291)" />
      <path d="M150 520 V246 a52 52 0 0 1 104 0 V520 Z" fill="currentColor" />
      <path d="M254 520 V392 a56 56 0 0 1 112 0 V520 Z" fill="#FFC23D" />
      <circle cx="104" cy="520" r="128" fill="#F58905" />
      <path d="M330 230 l26 -26 M342 242 l26 -26" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
