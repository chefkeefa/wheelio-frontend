// SDK (savininko deklaravimo kodas): the 8-character owner declaration code Regitra issues for every vehicle
// registered in Lithuania. The law requires it in sale advertisements; buyers check it on eRegitra.

export const SDK_CHECK_URL = "https://www.eregitra.lt/services/vehicle-declaration/info-by-owner-declaration-code-search";
export const SDK_HELP_URL = "https://www.regitra.lt/";

/** "ab12-cd34 " → "AB12CD34"; null when it is not 8 letters or digits (same rule as the API). */
export function normalizeSdk(value: string): string | null {
  const v = value.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z0-9]{8}$/.test(v) ? v : null;
}
