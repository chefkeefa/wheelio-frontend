// Public contact and operator details shown in the footer, on /contacts and in the privacy policy.
// Company details stay hidden until they are set: a marketplace without a named operator looks
// untrustworthy, but made-up details would be worse.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@wheelio.lt";
/** Business offers and partnerships. */
export const PARTNERS_EMAIL = process.env.NEXT_PUBLIC_PARTNERS_EMAIL || "partners@wheelio.lt";
/** Spam, abuse and security reports (illegal content goes through /report). */
export const ABUSE_EMAIL = process.env.NEXT_PUBLIC_ABUSE_EMAIL || "abuse@wheelio.lt";

export const COMPANY = {
  /** Legal name, e.g. "MB Wheelio" or "UAB ...". */
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "",
  /** Company registration code (įmonės kodas). */
  code: process.env.NEXT_PUBLIC_COMPANY_CODE || "",
  /** VAT code (PVM mokėtojo kodas), if registered. */
  vat: process.env.NEXT_PUBLIC_COMPANY_VAT || "",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "",
};

export const HAS_COMPANY_DETAILS = Boolean(COMPANY.name);
