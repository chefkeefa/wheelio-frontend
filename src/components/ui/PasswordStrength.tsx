"use client";

import { useLanguage } from "@/context/LanguageContext";
import { PASSWORD_RULES, isStrongPassword, passwordScore } from "@/lib/passwordPolicy";

/** Strength bar (red, yellow, green) and the list of password rules, each ticked once met. */
export default function PasswordStrength({ password }: { password: string }) {
  const { tr } = useLanguage();
  const score = passwordScore(password);
  const strong = isStrongPassword(password);
  const level = strong ? "strong" : score >= 2 ? "medium" : "weak";
  const color = { weak: "bg-red-500", medium: "bg-yellow-400", strong: "bg-green-500" }[level];
  const text = { weak: "text-red-500", medium: "text-yellow-500", strong: "text-green-600" }[level];
  const word = {
    weak: tr("Weak", "Silpnas", "Слабый"),
    medium: tr("Medium", "Vidutinis", "Средний"),
    strong: tr("Strong", "Stiprus", "Сильный"),
  }[level];
  const width = password ? Math.max(score, 1) / PASSWORD_RULES.length : 0;

  return (
    <div className="mt-3 px-1" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border">
          <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${width * 100}%` }} />
        </div>
        <span className={`w-20 text-right text-sm font-semibold ${password ? text : "text-muted-foreground"}`}>
          {password ? word : tr("Weak", "Silpnas", "Слабый")}
        </span>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-2 ${ok ? "text-green-600" : "text-muted-foreground"}`}>
              <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-green-500 text-white" : "ring-1 ring-inset ring-border"}`}>
                {ok ? "✓" : ""}
              </span>
              {tr(rule.label[0], rule.label[1], rule.label[2])}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
