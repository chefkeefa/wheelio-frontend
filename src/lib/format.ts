export const nf = (locale = "lt-LT") => new Intl.NumberFormat(locale);

export function formatPrice(value: number, locale = "lt-LT") {
  return `${nf(locale).format(value)} €`;
}
