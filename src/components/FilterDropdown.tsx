"use client";

import React, { useId } from "react";
import { anybody } from "@/lib/fonts";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
  allowCustom?: boolean;
}

function isAnyValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["any", "bet kuris", "bet kuri", "любая", "любой", "любое"].includes(normalized);
}

export default function FilterDropdown({ label, value, options, onChange, className = "", allowCustom = false }: Props) {
  const isAny = isAnyValue(value);
  const listId = useId().replace(/:/g, "");

  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className={`${anybody.className} text-[15px] font-bold text-foreground md:text-base`}>{label}</span>
      <div className="relative">
        {allowCustom ? (
          <>
            <input
              type="text"
              list={listId}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={(event) => { if (isAnyValue(event.currentTarget.value)) onChange(""); }}
              onBlur={(event) => { if (!event.currentTarget.value.trim()) onChange(options[0] || ""); }}
              autoComplete="off"
              className={[anybody.className,"h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 pr-10 text-[15px] text-white outline-none transition focus:border-[#f4b92f] focus:bg-white/[0.14]",isAny ? "font-normal text-white/55" : "font-semibold"].join(" ")}
            />
            <datalist id={listId}>{options.filter((o) => !isAnyValue(o)).map((option) => <option key={option} value={option} />)}</datalist>
          </>
        ) : (
          <select value={value} onChange={(event) => onChange(event.target.value)} className={[anybody.className,"h-11 w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 pr-10 text-[15px] text-white outline-none transition focus:border-[#f4b92f]",isAny ? "font-normal text-white/55" : "font-semibold"].join(" ")}>
            {options.map((option) => <option key={option} value={option} className="bg-[#1b1b1d] text-white">{option}</option>)}
          </select>
        )}
        <img src="/icons/chevron-down.svg" alt="" className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 opacity-60 invert" aria-hidden="true" />
      </div>
    </label>
  );
}
