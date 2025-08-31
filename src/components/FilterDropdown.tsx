/* eslint-disable @next/next/no-img-element */
import React from "react";
import { anybody } from "@/lib/fonts";

type Option = string;

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: Props) {
  const isAny = typeof value === "string" && value.trim().toLowerCase() === "any";

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      {/* label: немного крупнее + Anybody bold */}
      <span
        className={`${anybody.className} text-[15px] md:text-base font-bold text-[hsl(var(--muted-foreground))]`}
      >
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            anybody.className,
            // прямоугольник с нужным фоном
            "w-full appearance-none rounded-xl border border-[hsl(var(--border))] bg-[#D9D9D9]",
            "px-4 py-2.5 text-[15px]",
            // подстановка стиля для Any
            isAny ? "font-normal text-[#8C8C8C]" : "font-bold text-[hsl(var(--foreground))]",
            "outline-none ring-0 focus:border-[hsl(var(--accent))] transition-colors",
          ].join(" ")}
        >
          {options.map((opt) => {
            const isOptAny = opt.trim().toLowerCase() === "any";
            return (
              <option
                key={opt}
                value={opt}
                // подсказка: опции стилизуются ограниченно, но поставим семантику
                className={isOptAny ? "font-normal text-[#8C8C8C]" : "font-bold"}
              >
                {opt}
              </option>
            );
          })}
        </select>

        {/* caret */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}
