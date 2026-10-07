/**
 * Same rules as the backend (src/common/password-policy.ts): 6+ characters with a lowercase letter,
 * an uppercase letter and a digit. Letters may be from any alphabet.
 */
export const PASSWORD_RULES = [
  { key: "length", test: (p: string) => [...p].length >= 6, label: ["At least 6 characters", "Bent 6 simboliai", "Минимум 6 символов"] },
  { key: "lower", test: (p: string) => /\p{Ll}/u.test(p), label: ["A lowercase letter", "Mažoji raidė", "Строчная буква"] },
  { key: "upper", test: (p: string) => /\p{Lu}/u.test(p), label: ["An uppercase letter", "Didžioji raidė", "Заглавная буква"] },
  { key: "digit", test: (p: string) => /\d/.test(p), label: ["A number", "Skaičius", "Цифра"] },
] as const;

export function passwordScore(password: string): number {
  return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

export function isStrongPassword(password: string): boolean {
  return passwordScore(password) === PASSWORD_RULES.length && new TextEncoder().encode(password).length <= 72;
}
