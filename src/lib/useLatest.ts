import { useEffect, useRef } from "react";

/**
 * Keeps the latest value in a ref, for reading inside effects/callbacks that must not
 * re-run when the value changes (e.g. translated error messages in one-time loaders).
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
