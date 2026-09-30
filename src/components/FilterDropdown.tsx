import React from "react";
import { anybody } from "@/lib/fonts";
import AssetIcon from "@/components/ui/AssetIcon";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

function isAnyValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["any", "bet kuris", "bet kuri", "любая", "любой", "любое"].includes(normalized);
}

export default function FilterDropdown({ label, value, options, onChange, className = "" }: Props) {
  const isAny = isAnyValue(value);

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className={`${anybody.className} text-[15px] font-bold text-foreground md:text-base`}>
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            anybody.className,
            "min-h-11 w-full touch-manipulation appearance-none rounded-xl border border-border bg-[#D9D9D9] px-4 py-2.5 pr-10 text-base outline-none transition-colors focus:border-accent",
            isAny ? "font-normal text-[#7b7b7b]" : "font-bold text-black",
          ].join(" ")}
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-white font-medium text-black">
              {option}
            </option>
          ))}
        </select>

        <AssetIcon
          name="chevron-down"
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/60"
        />
      </div>
    </label>
  );
}
