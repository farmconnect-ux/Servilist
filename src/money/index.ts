import { CurrencyCode } from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  minorFactor: number; // multiplier from major unit to minor unit (e.g. 100 for cents/kobo)
  displayDecimals: number; // decimal places to show in UI
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', minorFactor: 100, displayDecimals: 0 },
  KES: {
    code: 'KES',
    symbol: 'KSh ',
    name: 'Kenyan Shilling',
    minorFactor: 100,
    displayDecimals: 0,
  },
  GHS: { code: 'GHS', symbol: 'GH₵ ', name: 'Ghanaian Cedi', minorFactor: 100, displayDecimals: 2 },
  ZAR: {
    code: 'ZAR',
    symbol: 'R ',
    name: 'South African Rand',
    minorFactor: 100,
    displayDecimals: 2,
  },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', minorFactor: 100, displayDecimals: 2 },
  EGP: { code: 'EGP', symbol: 'E£ ', name: 'Egyptian Pound', minorFactor: 100, displayDecimals: 2 },
  RWF: { code: 'RWF', symbol: 'FRw ', name: 'Rwandan Franc', minorFactor: 100, displayDecimals: 0 },
  TZS: {
    code: 'TZS',
    symbol: 'TSh ',
    name: 'Tanzanian Shilling',
    minorFactor: 100,
    displayDecimals: 0,
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh ',
    name: 'Ugandan Shilling',
    minorFactor: 100,
    displayDecimals: 0,
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA ',
    name: 'West African CFA Franc',
    minorFactor: 100,
    displayDecimals: 0,
  },
};

// Default exchange rates (Base: 1 USD)
export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  NGN: 1500.0,
  KES: 130.0,
  GHS: 15.5,
  ZAR: 18.5,
  EGP: 48.0,
  RWF: 1350.0,
  TZS: 2600.0,
  UGX: 3700.0,
  XOF: 600.0,
};

export function getMinorFactor(currency: CurrencyCode): number {
  return CURRENCY_CONFIGS[currency]?.minorFactor ?? 100;
}

export function toMinorUnits(majorAmount: number, currency: CurrencyCode): number {
  const factor = getMinorFactor(currency);
  return Math.round(majorAmount * factor);
}

export function fromMinorUnits(minorAmount: number, currency: CurrencyCode): number {
  const factor = getMinorFactor(currency);
  return minorAmount / factor;
}

/**
 * Converts an integer minor amount from one currency to another using USD-anchored rates.
 * Display conversion only; does not mutate original transaction pricing.
 */
export function convertMinor(
  amountMinor: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) {
    return amountMinor;
  }

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  const majorAmount = fromMinorUnits(amountMinor, fromCurrency);
  const amountUsd = majorAmount / fromRate;
  const targetMajor = amountUsd * toRate;

  return toMinorUnits(targetMajor, toCurrency);
}

/**
 * Formats minor unit amounts for display with proper currency symbols and locale separators.
 */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  options?: {
    showSecondary?: boolean;
    targetCurrency?: CurrencyCode;
    rates?: Record<CurrencyCode, number>;
  }
): string {
  const cfg = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const major = fromMinorUnits(amountMinor, currency);

  const formattedMain =
    cfg.displayDecimals === 0
      ? `${cfg.symbol}${Math.round(major).toLocaleString('en-US')}`
      : `${cfg.symbol}${major.toLocaleString('en-US', {
          minimumFractionDigits: cfg.displayDecimals,
          maximumFractionDigits: cfg.displayDecimals,
        })}`;

  if (options?.showSecondary && options?.targetCurrency && options.targetCurrency !== currency) {
    const targetCurr = options.targetCurrency;
    const targetCfg = CURRENCY_CONFIGS[targetCurr] || CURRENCY_CONFIGS.USD;
    const convertedMinor = convertMinor(amountMinor, currency, targetCurr, options.rates);
    const convertedMajor = fromMinorUnits(convertedMinor, targetCurr);

    const formattedSecondary =
      targetCfg.displayDecimals === 0
        ? `${targetCfg.symbol}${Math.round(convertedMajor).toLocaleString('en-US')}`
        : `${targetCfg.symbol}${convertedMajor.toLocaleString('en-US', {
            minimumFractionDigits: targetCfg.displayDecimals,
            maximumFractionDigits: targetCfg.displayDecimals,
          })}`;

    return `${formattedMain} (~${formattedSecondary})`;
  }

  return formattedMain;
}
