"use client";

import { usePriceRange } from "@/components/filters/price/usePriceRange";

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  step?: number;
  onRangeChange?: (min: number, max: number) => void; // max = Infinity при режиме ">"
}

export default function PriceRangeSlider({
  minPrice = 0,
  maxPrice = 100_000,
  step = 1_000,
  onRangeChange,
}: PriceRangeSliderProps) {
  const {
    minValue,
    maxValue,
    maxOverflow,
    rawMin,
    rawMax,
    trackRef,
    fmt,
    leftPct,
    rightPct,
    setDragging,
    onMinInput,
    onMaxInput,
    commitMin,
    commitMax,
    onKey,
    handleTrackPointerDown,
  } = usePriceRange({ minPrice, maxPrice, step, onChange: onRangeChange });

  const rightLabel = (maxOverflow ? ">" : "") + fmt.format(maxPrice) + "€";

  return (
    <div className="space-y-3">
      <label className="block text-base font-semibold text-black">Price</label>

      <div className="flex justify-between text-base font-semibold text-black">
        <span>{fmt.format(minPrice)}€</span>
        <span>{rightLabel}</span>
      </div>

      {/* ТОНКИЙ слайдер */}
      <div
        ref={trackRef}
        className="relative h-2 rounded-full bg-[#d9d9d9]"
        onPointerDown={handleTrackPointerDown}
        style={{ cursor: "pointer" }}
      >
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(rightPct - leftPct, 0)}%`,
            background: "hsl(var(--accent))",
          }}
        />

        <button
          type="button"
          role="slider"
          aria-label="Минимальная цена"
          aria-valuemin={minPrice}
          aria-valuemax={maxPrice}
          aria-valuenow={minValue}
          tabIndex={0}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full border bg-white border-[hsl(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
          style={{ left: `${leftPct}%`, touchAction: "none" as any, cursor: "grab" }}
          onPointerDown={() => setDragging("min")}
          onKeyDown={(e) => onKey("min", e)}
        />

        <button
          type="button"
          role="slider"
          aria-label="Максимальная цена"
          aria-valuemin={minPrice}
          aria-valuemax={maxPrice}
          aria-valuenow={maxOverflow ? maxPrice : maxValue}
          tabIndex={0}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full border bg-white border-[hsl(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
          style={{ left: `${rightPct}%`, touchAction: "none" as any, cursor: "grab" }}
          onPointerDown={() => setDragging("max")}
          onKeyDown={(e) => onKey("max", e)}
        />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={rawMin ?? (minValue === minPrice ? "" : fmt.format(minValue))}
            onChange={(e) => onMinInput(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commitMin())}
            className="h-10 w-full rounded-lg bg-[#d9d9d9] px-3 pr-8 text-base font-semibold text-[#8c8c8c] placeholder-[#8c8c8c]"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-semibold text-[#8c8c8c]">€</span>
        </div>

        <div className="relative flex-1">
          {maxOverflow && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-[#8c8c8c]">{">"}</span>
          )}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={fmt.format(maxPrice)}
            value={
              rawMax ??
              (maxOverflow ? fmt.format(maxPrice) : (maxValue === maxPrice ? "" : fmt.format(maxValue)))
            }
            onChange={(e) => onMaxInput(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commitMax())}
            className={`h-10 w-full rounded-lg bg-[#d9d9d9] ${maxOverflow ? "pl-8" : "pl-3"} pr-8 text-base font-semibold text-[#8c8c8c] placeholder-[#8c8c8c]`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-semibold text-[#8c8c8c]">€</span>
        </div>
      </div>
    </div>
  );
}
