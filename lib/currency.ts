/**
 * Multi-Currency Support Utilities
 * 
 * Provides currency formatting, conversion, and configuration
 * for SmartSpend's global expansion.
 */

export const CURRENCIES = {
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound', flag: '🇬🇧' },
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee', flag: '🇮🇳' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen', flag: '🇯🇵' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar', flag: '🇨🇦' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar', flag: '🇸🇬' },
  AED: { symbol: 'د.إ', locale: 'ar-AE', name: 'UAE Dirham', flag: '🇦🇪' },
  SAR: { symbol: '﷼', locale: 'ar-SA', name: 'Saudi Riyal', flag: '🇸🇦' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_LIST = Object.entries(CURRENCIES).map(([code, config]) => ({
  code: code as CurrencyCode,
  ...config,
}));

/**
 * Format amount according to currency locale and standards
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  options?: Intl.NumberFormatOptions
): string {
  const config = CURRENCIES[currency];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format amount with custom symbol (for display purposes)
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: CurrencyCode = 'INR'
): string {
  const config = CURRENCIES[currency];
  const formatted = Math.abs(amount).toLocaleString(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const symbol = config.symbol;
  const isNegative = amount < 0;
  
  // Some currencies put symbol after the amount
  if (['INR'].includes(currency)) {
    return `${isNegative ? '-' : ''}${symbol}${formatted}`;
  }
  
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Convert amount from one currency to another using exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Convert to USD first (base currency)
  const usdRate = exchangeRates[fromCurrency] || 1;
  const amountInUSD = amount / usdRate;
  
  // Convert from USD to target currency
  const targetRate = exchangeRates[toCurrency] || 1;
  return amountInUSD * targetRate;
}

/**
 * Get currency configuration by code
 */
export function getCurrencyConfig(code: string): typeof CURRENCIES[CurrencyCode] | undefined {
  return CURRENCIES[code as CurrencyCode];
}

/**
 * Validate if a currency code is supported
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}

/**
 * Parse currency string to code (case-insensitive)
 */
export function parseCurrencyCode(code: string): CurrencyCode | null {
  const upperCode = code.toUpperCase();
  return isValidCurrency(upperCode) ? upperCode as CurrencyCode : null;
}

/**
 * Get default currency based on user locale
 */
export function getDefaultCurrency(): CurrencyCode {
  if (typeof window === 'undefined') {
    return 'INR'; // Default to INR on server
  }
  
  const userLocale = navigator.language || 'en-IN';
  
  // Map common locales to currencies
  const localeToCurrency: Record<string, CurrencyCode> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'de-DE': 'EUR',
    'fr-FR': 'EUR',
    'es-ES': 'EUR',
    'it-IT': 'EUR',
    'ja-JP': 'JPY',
    'en-AU': 'AUD',
    'en-CA': 'CAD',
    'en-SG': 'SGD',
    'ar-AE': 'AED',
    'ar-SA': 'SAR',
    'en-IN': 'INR',
    'hi-IN': 'INR',
  };
  
  // Try exact match first
  if (localeToCurrency[userLocale]) {
    return localeToCurrency[userLocale];
  }
  
  // Try language code match
  const langCode = userLocale.split('-')[0];
  for (const [locale, currency] of Object.entries(localeToCurrency)) {
    if (locale.startsWith(langCode)) {
      return currency;
    }
  }
  
  return 'INR'; // Fallback to INR
}

/**
 * Short format for large amounts (e.g., 1.5K, 2.3M)
 */
export function formatCurrencyShort(
  amount: number,
  currency: CurrencyCode = 'INR'
): string {
  const absAmount = Math.abs(amount);
  let shortValue: number;
  let suffix: string;
  
  if (absAmount >= 1_000_000_000) {
    shortValue = absAmount / 1_000_000_000;
    suffix = 'B';
  } else if (absAmount >= 1_000_000) {
    shortValue = absAmount / 1_000_000;
    suffix = 'M';
  } else if (absAmount >= 1_000) {
    shortValue = absAmount / 1_000;
    suffix = 'K';
  } else {
    return formatCurrency(amount, currency);
  }
  
  const formatted = shortValue.toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: shortValue % 1 === 0 ? 0 : 1,
  });
  
  const symbol = CURRENCIES[currency].symbol;
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${symbol}${formatted}${suffix}`;
}
