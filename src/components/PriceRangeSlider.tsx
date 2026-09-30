"use client";

import React, { useEffect, useRef, useState } from "react";
import { anybody } from "@/lib/fonts";

interface Props {
  minPrice: number;
  maxPrice: number;
  step?: number;
  onRangeChange: (min: number, max: number) => void;
  className?: string;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

type Dragging = "min" | "max" | null;

export default function PriceRangeSlider({
  minPrice,
  maxPrice,
  step = 100,
  onRangeChange,
  className = "",
  label = "Price range",
  minLabel = "Min",
  maxLabel = "Max",
}: Props) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const [dragging, setDragging] = useState<Dragging>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMin(minPrice);
    setMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => onRangeChange(min, max));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  const clamp = (v: number) => Math.min(Math.max(v, minPrice), maxPrice);
  const percent = (v: number) => ((v - minPrice) / (maxPrice - minPrice)) * 100;
  const roundToStep = (v: number) => Math.round(v / step) * step;

  const valueFromPointerX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return minPrice;
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = x / rect.width;
    const raw = minPrice + ratio * (maxPrice - minPrice);
    return clamp(roundToStep(raw));
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const val = valueFromPointerX(e.clientX);
    const distToMin = Math.abs(val - min);
    const distToMax = Math.abs(val - max);
    const target: Dragging = distToMin <= distToMax ? "min" : "max";
    setDragging(target);
    if (target === "min") setMin(Math.min(val, max - step));
    else setMax(Math.max(val, min + step));
  };

  const onThumbPointerDown = (which: Dragging) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(which);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const val = valueFromPointerX(e.clientX);
    if (dragging === "min") setMin(Math.min(val, max - step));
    else setMax(Math.max(val, min + step));
  };
  const endDrag = (e: React.PointerEvent) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setDragging(null);
  };

  const onThumbKeyDown = (which: Dragging) => (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -step;
    if (e.key === "ArrowRight") delta = step;
    if (e.key === "PageDown") delta = -step * 10;
    if (e.key === "PageUp") delta = step * 10;
    if (delta !== 0) {
      e.preventDefault();
      if (which === "min") setMin((v) => Math.min(clamp(roundToStep(v + delta)), max - step));
      else setMax((v) => Math.max(clamp(roundToStep(v + delta)), min + step));
    }
  };

  // Cheap arithmetic; memoizing it only produced stale-dependency warnings.
  const leftPct = percent(min);
  const rightPct = 100 - percent(max);

  return (
    <div className={`w-full select-none ${className}`}>
      {/* label: немного крупнее */}
      <label className={`${anybody.className} mb-2 block text-[15px] md:text-base font-bold text-foreground`}>
        {label}
      </label>

      <div
        ref={trackRef}
        className={["relative h-12", dragging ? "cursor-grabbing" : "cursor-pointer"].join(" ")}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* трек — #D9D9D9 */}
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#D9D9D9]" />
        {/* выделение диапазона */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[hsl(var(--accent))]"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        {/* MIN */}
        <button
          type="button"
          role="slider"
          aria-label="Minimum price"
          aria-valuemin={minPrice}
          aria-valuemax={max - step}
          aria-valuenow={min}
          tabIndex={0}
          onKeyDown={onThumbKeyDown("min")}
          onPointerDown={onThumbPointerDown("min")}
          className={[
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full outline-none",
            "after:block after:h-5 after:w-5 after:rounded-full after:border-2 after:border-white after:bg-[hsl(var(--accent))] after:shadow",
            "before:absolute before:-inset-2 before:rounded-full before:content-['']",
            dragging === "min" ? "ring-4 ring-[hsl(var(--accent))/0.25]" : "",
          ].join(" ")}
          style={{ left: `${leftPct}%` }}
        />
        {/* MAX */}
        <button
          type="button"
          role="slider"
          aria-label="Maximum price"
          aria-valuemin={min + step}
          aria-valuemax={maxPrice}
          aria-valuenow={max}
          tabIndex={0}
          onKeyDown={onThumbKeyDown("max")}
          onPointerDown={onThumbPointerDown("max")}
          className={[
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full outline-none",
            "after:block after:h-5 after:w-5 after:rounded-full after:border-2 after:border-white after:bg-[hsl(var(--accent))] after:shadow",
            "before:absolute before:-inset-2 before:rounded-full before:content-['']",
            dragging === "max" ? "ring-4 ring-[hsl(var(--accent))/0.25]" : "",
          ].join(" ")}
          style={{ left: `${100 - rightPct}%` }}
        />
      </div>

      <div className={`${anybody.className} mt-3 flex items-center justify-between text-sm text-foreground`}>
        <span>
          {minLabel}:{" "}
          <strong className="font-bold text-foreground">{min.toLocaleString()} €</strong>
        </span>
        <span>
          {maxLabel}:{" "}
          <strong className="font-bold text-foreground">{max.toLocaleString()} €</strong>
        </span>
      </div>
    </div>
  );
}
