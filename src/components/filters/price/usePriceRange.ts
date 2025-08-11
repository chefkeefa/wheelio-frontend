import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

export function usePriceRange({
  minPrice = 0,
  maxPrice = 100_000,
  step = 1_000,
  onChange,
}: {
  minPrice?: number;
  maxPrice?: number;
  step?: number;
  onChange?: (min: number, max: number) => void; // max = Infinity в режиме ">"
}) {
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);
  const [maxOverflow, setMaxOverflow] = useState(false);
  const [rawMin, setRawMin] = useState<string | null>(null);
  const [rawMax, setRawMax] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | "min" | "max">(null);
  const fmt = useMemo(() => new Intl.NumberFormat("lt-LT"), []);

  const clamp = useCallback((v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi), []);
  const snap = useCallback((v: number) => Math.round(v / step) * step, [step]);
  const toPct = useCallback((v: number) => ((v - minPrice) / (maxPrice - minPrice)) * 100, [minPrice, maxPrice]);

  const parseDigits = useCallback((s: string) => {
    const d = s.replace(/[^\d]/g, "");
    return d ? parseInt(d, 10) : NaN;
  }, []);

  const emit = useCallback(
    (minV: number, maxV: number, overflow = maxOverflow) => {
      onChange?.(minV, overflow ? Infinity : maxV);
    },
    [onChange, maxOverflow]
  );

  const setMinSafe = useCallback(
    (v: number) => {
      const next = clamp(snap(v), minPrice, maxOverflow ? maxPrice : maxValue);
      setMinValue(next);
      emit(next, maxOverflow ? maxPrice : maxValue);
    },
    [clamp, snap, minPrice, maxPrice, maxValue, maxOverflow, emit]
  );

  const setMaxSafe = useCallback(
    (v: number) => {
      const next = clamp(snap(v), minValue, maxPrice);
      setMaxOverflow(false);
      setMaxValue(next);
      emit(minValue, next, false);
    },
    [clamp, snap, minValue, maxPrice, emit]
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return minPrice;
      const rect = trackRef.current.getBoundingClientRect();
      const px = clamp(clientX - rect.left, 0, rect.width);
      const ratio = rect.width ? px / rect.width : 0;
      const raw = minPrice + ratio * (maxPrice - minPrice);
      return clamp(raw, minPrice, maxPrice);
    },
    [clamp, minPrice, maxPrice]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const val = valueFromClientX(e.clientX);
      if (dragging === "min") setMinSafe(Math.min(val, maxOverflow ? maxPrice : maxValue));
      else setMaxSafe(Math.max(val, minValue));
    };
    const onUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, minValue, maxValue, maxOverflow, maxPrice, setMinSafe, setMaxSafe, valueFromClientX]);

  return {
    minValue,
    maxValue,
    maxOverflow,
    rawMin,
    rawMax,
    trackRef,
    dragging,
    fmt,
    leftPct: toPct(minValue),
    rightPct: toPct(maxOverflow ? maxPrice : maxValue),
    setDragging,
    onMinInput: (s: string) => {
      setRawMin(s);
      const v = parseDigits(s);
      if (!Number.isNaN(v)) setMinSafe(v);
    },
    onMaxInput: (s: string) => {
      setRawMax(s);
      const v = parseDigits(s);
      if (Number.isNaN(v)) return;
      if (v > maxPrice) {
        setMaxOverflow(true);
        setMaxValue(maxPrice);
        emit(minValue, maxPrice, true);
      } else {
        setMaxOverflow(false);
        setMaxSafe(v);
      }
    },
    commitMin: () => {
      const v = parseDigits(rawMin ?? "");
      setMinSafe(Number.isNaN(v) ? minPrice : v);
      setRawMin(null);
    },
    commitMax: () => {
      const v = parseDigits(rawMax ?? "");
      if (Number.isNaN(v)) {
        setMaxOverflow(false);
        setMaxSafe(maxPrice);
      } else if (v > maxPrice) {
        setMaxOverflow(true);
        setMaxValue(maxPrice);
        emit(minValue, maxPrice, true);
      } else {
        setMaxOverflow(false);
        setMaxSafe(v);
      }
      setRawMax(null);
    },
    onKey: (who: "min" | "max", e: React.KeyboardEvent) => {
      const delta =
        e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -step
          : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? step
          : e.key === "PageDown"
          ? -step * 10
          : e.key === "PageUp"
          ? step * 10
          : e.key === "Home"
          ? -(1e15)
          : e.key === "End"
          ? +(1e15)
          : 0;
      if (delta !== 0) {
        e.preventDefault();
        if (who === "min") setMinSafe(minValue + delta);
        else setMaxSafe((maxOverflow ? maxPrice : maxValue) + delta);
      }
    },
    handleTrackPointerDown: (e: React.PointerEvent) => {
      const clicked = valueFromClientX(e.clientX);
      const distToMin = Math.abs(clicked - minValue);
      const effectiveMax = maxOverflow ? maxPrice : maxValue;
      const distToMax = Math.abs(clicked - effectiveMax);
      if (distToMin <= distToMax) {
        setDragging("min");
        setMinSafe(clicked);
        setRawMin(null);
      } else {
        setDragging("max");
        setMaxSafe(clicked);
        setRawMax(null);
      }
    },
  };
}
