import Icon from "@/components/ui/Icon";

type RawOption = string | { label: string; value: string };

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: RawOption[];
  onChange: (value: string) => void;
}) {
  const id = `fd-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const normalized = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );

  return (
    <label htmlFor={id} className="flex flex-col items-start gap-1">
      <span className="text-base font-semibold text-black">{label}</span>

      <div className="relative w-full">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg bg-[#d9d9d9] px-3 pr-8 text-base font-semibold text-[#8c8c8c]
                     appearance-none border-0 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
        >
          {normalized.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <Icon name="chevronDown" size={14} />
        </span>
      </div>
    </label>
  );
}
