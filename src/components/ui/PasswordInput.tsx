"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";

/** Password field with an eye button on the right that shows or hides what was typed. */
export default function PasswordInput({ style, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { tr } = useLanguage();
  const [visible, setVisible] = useState(false);
  const label = visible
    ? tr("Hide password", "Slėpti slaptažodį", "Скрыть пароль")
    : tr("Show password", "Rodyti slaptažodį", "Показать пароль");

  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} style={{ ...style, paddingRight: 48 }} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-1.5 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        <AssetIcon name={visible ? "eye-off" : "eye"} size={20} />
      </button>
    </span>
  );
}
