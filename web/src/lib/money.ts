/**
 * Money is stored as whole minor units (kobo, cents) with its currency, and is
 * never converted for storage. This module only formats it for display.
 */
export const CURRENCIES = {
  NGN: { symbol: "₦", minorFactor: 100, decimals: 0 },
  KES: { symbol: "KSh ", minorFactor: 100, decimals: 0 },
  GHS: { symbol: "GH₵", minorFactor: 100, decimals: 2 },
  ZAR: { symbol: "R", minorFactor: 100, decimals: 2 },
  USD: { symbol: "$", minorFactor: 100, decimals: 2 },
  EGP: { symbol: "E£", minorFactor: 100, decimals: 2 },
  RWF: { symbol: "FRw ", minorFactor: 1, decimals: 0 },
  TZS: { symbol: "TSh ", minorFactor: 100, decimals: 0 },
  UGX: { symbol: "USh ", minorFactor: 1, decimals: 0 },
  XOF: { symbol: "CFA ", minorFactor: 1, decimals: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function isCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}

export function formatMoney(amountMinor: number, currency: string): string {
  if (!isCurrency(currency)) return `${amountMinor} ${currency}`;
  const { symbol, minorFactor, decimals } = CURRENCIES[currency];
  const major = amountMinor / minorFactor;
  return (
    symbol +
    major.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function toMinorUnits(amountMajor: number, currency: string): number {
  const factor = isCurrency(currency) ? CURRENCIES[currency].minorFactor : 100;
  return Math.round(amountMajor * factor);
}

export function fromMinorUnits(amountMinor: number, currency: string): number {
  const factor = isCurrency(currency) ? CURRENCIES[currency].minorFactor : 100;
  return amountMinor / factor;
}
