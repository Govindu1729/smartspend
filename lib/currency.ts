// Currency formatting and conversion utilities
const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 83.5,
  EUR: 90.0,
  GBP: 105.0,
  SGD: 62.0,
  AED: 22.7,
  SAR: 22.3,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AED: 'AED',
  SAR: 'SAR',
};

export function formatAmount(
  amount: number, 
  currency: string, 
  options?: Intl.NumberFormatOptions
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-IN', options)}`;
}

export function convertToInr(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES_TO_INR[fromCurrency] || 1;
  return amount * rate;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const rateFrom = EXCHANGE_RATES_TO_INR[fromCurrency] || 1;
  const rateTo = EXCHANGE_RATES_TO_INR[toCurrency] || 1;
  return rateFrom / rateTo;
}
