"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AssetIcon from "@/components/ui/AssetIcon";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Other spellings that should also find this option (e.g. the Cyrillic name). */
  aliases?: (string | null | undefined)[];
};

interface Props {
  id?: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder: string;
  /** Shown in the list when the typed text matches nothing. */
  noMatchText: string;
  disabled?: boolean;
  className?: string;
}

/** Lower case without accents and punctuation, so "skoda" finds "Škoda" and "mercedes benz" finds "Mercedes-Benz". */
function fold(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Text field with a filtered list: the seller types part of a name and picks it from the list, or presses Enter on
 * the first match. Only listed values can be chosen; anything else reverts when the field loses focus.
 * The list is rendered in a portal so the card around the form cannot clip it.
 */
export default function Combobox({ id, value, options, onChange, placeholder, noMatchText, disabled = false, className = "" }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(0);
  // Opens below the field, or above it (anchored by its bottom edge) when there is little room below.
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);

  const current = options.find((o) => o.value === value);
  const shown = typing ? text : current?.label ?? value;

  const visible = useMemo(() => {
    const needle = typing ? fold(text) : "";
    if (!needle) return options;
    const starts: ComboboxOption[] = [];
    const contains: ComboboxOption[] = [];
    for (const option of options) {
      const keys = [option.label, ...(option.aliases || [])].filter(Boolean).map((k) => fold(String(k)));
      if (keys.some((k) => k.startsWith(needle))) starts.push(option);
      else if (keys.some((k) => k.includes(needle))) contains.push(option);
    }
    return [...starts, ...contains];
  }, [options, text, typing]);

  const close = () => {
    setOpen(false);
    setTyping(false);
    setText("");
  };
  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      if (below >= Math.min(220, above)) setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width, maxHeight: Math.min(320, below) });
      else setPosition({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width, maxHeight: Math.min(320, above) });
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
      if (!popoverRef.current?.contains(target) && !inputRef.current?.contains(target)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Highlight the chosen value when the list opens, the first match while typing.
  useEffect(() => {
    if (!open) return;
    setActive(typing ? 0 : Math.max(0, visible.findIndex((o) => o.value === value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, position]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (event.key === "Escape") {
      if (open) event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      // Leaving with a typed name that matches exactly one option keeps it.
      if (typing && visible.length === 1) onChange(visible[0].value);
      close();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={shown}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          setTyping(true);
          setText(event.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-xl border border-border bg-muted pl-4 pr-11 text-[15px] font-medium text-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-accent focus:bg-card disabled:cursor-not-allowed disabled:opacity-60"
      />
      <AssetIcon
        name={typing ? "search" : "chevron-down"}
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
      />

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
            className="fixed z-[120] flex flex-col overflow-hidden rounded-xl bg-card text-foreground shadow-xl ring-1 ring-border"
          >
            <ul ref={listRef} id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5 [scrollbar-width:thin]">
              {visible.map((option, index) => {
                const selected = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={selected} data-index={index}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(option)}
                      className={`flex min-h-10 w-full items-center justify-between gap-3 px-4 text-left text-sm transition ${
                        index === active ? "bg-foreground/[0.06]" : ""
                      } ${selected ? "font-bold text-accent-ink" : ""}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected && <AssetIcon name="check" size={16} className="shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {!visible.length && <li className="px-4 py-5 text-sm leading-6 text-muted-foreground">{noMatchText}</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
