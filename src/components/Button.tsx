/* eslint-disable @next/next/no-img-element */
import React from "react";

type ButtonAs = "button" | "div" | "span" | "label";
type Variant = "primary" | "ghost" | "link" | "outline";
type Size = "sm" | "md" | "lg";
type IconPosition = "left" | "right";

interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  icon?: string | React.ReactNode; // URL или React-элемент
  type?: "button" | "submit" | "reset"; // используется только если as="button"
  as?: ButtonAs;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconPosition?: IconPosition;
  htmlFor?: string; // для as="label"
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export default function Button({
  children,
  className = "",
  icon,
  type = "button",
  as = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconPosition = "left",
  htmlFor,
  onClick,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-lg transition-colors duration-200 select-none active:scale-[0.98]";
  const variants: Record<Variant, string> = {
    // как договорились: серый → при hover оранжевый
    primary: "bg-[#5f5f5f] font-semibold text-white hover:bg-[#d9a339]",
    ghost: "bg-transparent font-semibold text-foreground hover:text-accent",
    link: "bg-transparent font-medium text-[hsl(var(--accent))] hover:underline p-0",
    outline:
      "bg-transparent border border-[hsl(var(--border))] text-foreground hover:bg-muted",
  };
  const sizes: Record<Size, string> = {
    sm: "min-h-11 px-3 text-sm sm:min-h-8 sm:px-3",
    md: "min-h-11 px-4 text-base sm:min-h-10",
    lg: "min-h-12 px-6 text-lg font-extrabold",
  };
  const state = loading || disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "";
  const direction = iconPosition === "right" ? "flex-row-reverse" : "flex-row";
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${direction} ${state} ${className}`;

  const spinnerSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";

  const IconEl =
    typeof icon === "string"
      ? <img src={icon} alt="" className="h-4 w-4 translate-y-[1px]" />
      : icon
        ? <span className="inline-flex h-4 w-4 items-center justify-center translate-y-[1px]">{icon}</span>
        : null;

  const content = (
    <>
      {loading ? (
        <svg className={`animate-spin ${spinnerSize}`} viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
      ) : (
        <>
          {IconEl}
          {children}
        </>
      )}
    </>
  );

  // Ветка <button>
  if (as === "button") {
    return (
      <button
        type={type}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        className={cls}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {content}
      </button>
    );
  }

  // Полиморфический рендер для div/span/label
  const Component = as as React.ElementType;

  // htmlFor нужен только для <label>
  const extraProps = (as === "label" && htmlFor) ? { htmlFor } : {};

  return (
    <Component
      onClick={onClick}
      className={cls}
      aria-disabled={loading || disabled || undefined}
      aria-busy={loading || undefined}
      {...extraProps}
      {...rest}
    >
      {content}
    </Component>
  );
}
