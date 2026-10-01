/**
 * Indicative car leasing estimate for Lithuania. Defaults follow the published terms of the
 * big Lithuanian lessors in 2026 (Swedbank, SEB, Luminor, Citadele): a margin of about 2–2.3%
 * over 6-month EURIBOR, so roughly 5.7% a year; a down payment from 10% (20% is typical);
 * terms up to 84 months, as long as the car is at most 15 years old when the contract ends;
 * a contract fee of about 1% of the financed amount, at least €200.
 */
export const LEASING_DEFAULTS = {
  annualRate: 5.7,
  downPaymentPercent: 20,
  minDownPaymentPercent: 10,
  maxDownPaymentPercent: 50,
  termMonths: 60,
  maxTermMonths: 84,
  minTermMonths: 12,
  maxCarAgeAtEnd: 15,
  feePercent: 1,
  minFee: 200,
};

export const LEASING_TERMS = [12, 24, 36, 48, 60, 72, 84];

/** Longest term for a car of this year (0 when it is too old to lease). */
export function maxLeasingTerm(year: number | undefined, now = new Date()) {
  if (!year) return LEASING_DEFAULTS.maxTermMonths;
  const age = now.getFullYear() - year;
  const months = Math.floor((LEASING_DEFAULTS.maxCarAgeAtEnd - age) * 12);
  const capped = Math.min(LEASING_DEFAULTS.maxTermMonths, months);
  return capped >= LEASING_DEFAULTS.minTermMonths ? capped : 0;
}

/** Annuity payment: equal monthly payments that repay `principal` at `annualRate`% over `months`. */
export function monthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function leasingEstimate(price: number, downPaymentPercent: number, annualRate: number, months: number) {
  const downPayment = Math.round((price * downPaymentPercent) / 100);
  const financed = Math.max(0, price - downPayment);
  const monthly = monthlyPayment(financed, annualRate, months);
  const fee = financed > 0 ? Math.max(LEASING_DEFAULTS.minFee, (financed * LEASING_DEFAULTS.feePercent) / 100) : 0;
  const total = downPayment + monthly * months + fee;
  return { downPayment, financed, monthly, fee, total, interest: monthly * months - financed };
}
