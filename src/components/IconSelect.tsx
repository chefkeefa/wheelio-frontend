"use client";

import AssetIcon, { type AssetIconName } from "@/components/ui/AssetIcon";

type Option = { value: string; label: string };

interface Props {
  icon: AssetIconName;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Search field of the home page panel: icon, small label, current value and a native select on top for accessibility. */
export default function IconSelect({ icon, label, value, options, onChange, disabled = false }: Props) {
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <label
      className={`group relative flex h-16 min-w-0 items-center gap-3 rounded-xl bg-white/[0.06] px-4 ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-accent ${
        disabled ? "opacity-50" : "hover:bg-white/10"
      }`}
    >
      <AssetIcon name={icon} size={24} className="text-white/80" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-5 text-white">{label}</span>
        <span className="block truncate text-sm leading-5 text-white/55">{current?.label}</span>
      </span>
      <AssetIcon name="chevron-down" size={18} className="text-white/60" />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-black">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
