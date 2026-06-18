import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  // Map common user-friendly currency codes to Intl locales
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'en-IE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    AED: 'ar-AE',
  };
  const locale = localeMap[currency] || 'en-IN';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return `${currency} ${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Get the currency symbol for a currency code (without formatting a number).
 * Useful for placeholders like "₹{amount}".
 */
export function getCurrencySymbol(currency: string = 'INR'): string {
  try {
    const parts = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === 'currency')?.value;
    return symbol || currency;
  } catch {
    return currency;
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
}

export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy');
}

export function calculateSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  return Math.round(((income - expense) / income) * 100);
}

export function getMonthDateRange(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function groupTransactionsByCategory(transactions: Array<{ amount: number; type?: string; categories?: { name?: string } | null }>) {
  const groups: Record<string, { name: string; total: number; count: number }> = {};

  transactions.forEach((t) => {
    const categoryName = t.categories?.name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = { name: categoryName, total: 0, count: 0 };
    }
    groups[categoryName].total += t.amount;
    groups[categoryName].count += 1;
  });

  return Object.values(groups).sort((a, b) => b.total - a.total);
}

export function groupTransactionsByMonth(transactions: Array<{ amount: number; type: "income" | "expense"; date: string }>) {
  const groups: Record<string, { month: string; income: number; expense: number }> = {};

  transactions.forEach((t) => {
    const monthKey = format(parseISO(t.date), 'yyyy-MM');
    if (!groups[monthKey]) {
      groups[monthKey] = { month: monthKey, income: 0, expense: 0 };
    }
    const key = t.type as "income" | "expense";
    groups[monthKey][key] += t.amount;
  });

  return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
