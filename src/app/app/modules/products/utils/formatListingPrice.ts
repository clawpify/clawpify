/**
 * Format listing price from integer cents using an ISO currency code.
 */
export function formatListingPrice(cents: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currencyCode}`;
  }
}

export function centsToPriceInputString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parsePriceInputToCents(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.max(0, Math.round(n * 100));
}
