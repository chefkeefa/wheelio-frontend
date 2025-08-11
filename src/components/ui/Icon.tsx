type IconName =
  | "search"
  | "filter"
  | "reset"
  | "user"
  | "theme"
  | "lang"
  | "time"
  | "chevronDown";

export default function Icon({
  name,
  size = 24,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const stroke = "#8c8c8c";
  const stroke2 = "#111";
  switch (name) {
    case "search":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke={stroke2} strokeWidth="2" />
          <path d="M20 20l-4-4" stroke={stroke2} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "filter":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <path d="M4 6h16M7 12h10M10 18h4" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "reset":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.708" stroke={stroke} strokeWidth="2" />
          <path d="M3 4v5h5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <circle cx="12" cy="8" r="4" stroke={stroke2} strokeWidth="2" />
          <path d="M4 20c2-4 14-4 16 0" stroke={stroke2} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "theme":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke={stroke2} strokeWidth="2" />
        </svg>
      );
    case "lang":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke2} strokeWidth="2" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke={stroke2} strokeWidth="2" />
        </svg>
      );
    case "time":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke={stroke2} strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke={stroke2} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
          <path d="M7 10l5 5 5-5" stroke="#8c8c8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
