/* eslint-disable @next/next/no-img-element */
"use client";

/** Round profile photo, or the first letter of the name on a muted circle when there is none. */
export default function UserAvatar({ name, src, size = 48, className = "" }: { name: string; src?: string | null; size?: number; className?: string }) {
  const letter = (name.trim().charAt(0) || "W").toUpperCase();
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-extrabold text-muted-foreground ring-1 ring-border ${className}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : letter}
    </span>
  );
}
