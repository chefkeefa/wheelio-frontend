"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AssetIcon from "@/components/ui/AssetIcon";

export type DropdownOption = { value: string; label: string };

interface Props {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Shown in the field when nothing is chosen, and as the "clear" row at the top of the list. */
  placeholder: string;
  ariaLabel: string;
  /** Adds a search box above the list (long lists such as cities). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Shows the "clear" row; off for lists that always have a value (sorting). */
  clearable?: boolean;
  /** "inline": bare text inside a larger box; "field": a standalone rounded field. */
  variant?: "inline" | "field";
  className?: string;
}

/**
 * Styled replacement for a native <select> on the desktop search panel: a rounded field
 * that opens a scrollable list with a "clear" row. Rendered in a portal so the
 * collapsible parameters section cannot clip it.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  searchable = false,
  searchPlaceholder,
  clearable = true,
  variant = "field",
  className = "",
}: Props) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const current = options.find((o) => o.value === value);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? options.filter((o) => o.label.toLocaleLowerCase().includes(needle)) : options;
  }, [options, query]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    setQuery("");
    if (focusTrigger) triggerRef.current?.focus();
  };
  const choose = (next: string) => {
    onChange(next);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const maxHeight = Math.min(360, Math.max(below, above));
      const width = Math.max(rect.width, 200);
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      const top = below >= Math.min(240, above) ? rect.bottom + 6 : rect.top - 6 - maxHeight;
      setPosition({ top, left, width, maxHeight });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Start on the chosen item and keep the highlighted one in view.
  useEffect(() => {
    if (open) setActive(visible.findIndex((o) => o.value === value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, position]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (visible[active]) choose(visible[active].value);
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const triggerCls =
    variant === "inline"
      ? "h-7 text-sm"
      : `h-12 rounded-xl bg-white/[0.06] px-4 text-sm font-semibold ring-1 transition hover:bg-white/10 ${open ? "ring-accent" : "ring-white/10"}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={onKeyDown}
        className={`group flex min-w-0 items-center gap-2 text-left outline-none focus-visible:text-white ${triggerCls} ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${current ? "text-white" : "text-white/55"}`}>{current?.label ?? placeholder}</span>
        <AssetIcon name="chevron-down" size={16} className={`shrink-0 text-white/50 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            onKeyDown={onKeyDown}
            style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
            className="fixed z-[120] flex flex-col overflow-hidden rounded-2xl bg-ink-raised text-white shadow-[0_18px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
          >
            {searchable && (
              <div className="border-b border-white/10 p-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="h-10 w-full rounded-xl bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-white/45 focus:ring-1 focus:ring-accent"
                />
              </div>
            )}
            {clearable && (
            <button
              type="button"
              onClick={() => choose("")}
              className="flex min-h-11 shrink-0 items-center gap-2.5 border-b border-white/10 px-4 text-left text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              <AssetIcon name="close" size={14} />
              {placeholder}
            </button>
            )}
            <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5 [scrollbar-color:rgba(255,255,255,.25)_transparent] [scrollbar-width:thin]">
              {visible.map((o, index) => {
                const selected = o.value === value;
                return (
                  <li key={o.value} role="option" aria-selected={selected} data-index={index}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(o.value)}
                      className={`flex min-h-10 w-full items-center justify-between gap-3 px-4 text-left text-sm transition ${
                        index === active ? "bg-white/[0.08]" : ""
                      } ${selected ? "font-bold text-accent" : "text-white/90"}`}
                    >
                      <span className="truncate">{o.label}</span>
                      {selected && <AssetIcon name="check" size={16} className="shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {!visible.length && <li className="px-4 py-6 text-center text-sm text-white/50">—</li>}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
