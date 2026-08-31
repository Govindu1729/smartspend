'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CURRENCIES, formatCurrency, formatCurrencyWithSymbol, type CurrencyCode } from '@/lib/currency';

/**
 * Enhanced currency hook with full multi-currency support
 * Reads user preferences from profiles table and provides formatting utilities
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [symbol, setSymbol] = useState<string>('₹');
  const [locale, setLocale] = useState<string>('en-IN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Try to get currency from profiles table first
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_currency, currency_symbol')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const preferredCurrency = (profile.preferred_currency as CurrencyCode) || 'INR';
          const currencySymbol = profile.currency_symbol || CURRENCIES[preferredCurrency]?.symbol || '₹';
          const currencyLocale = CURRENCIES[preferredCurrency]?.locale || 'en-IN';
          
          setCurrency(preferredCurrency);
          setSymbol(currencySymbol);
          setLocale(currencyLocale);
        } else {
          // Fallback to user metadata
          const fallbackCurrency = (user.user_metadata?.currency as string) || 'INR';
          setCurrency(fallbackCurrency as CurrencyCode);
          setSymbol(CURRENCIES[fallbackCurrency as CurrencyCode]?.symbol || '₹');
          setLocale(CURRENCIES[fallbackCurrency as CurrencyCode]?.locale || 'en-IN');
        }
      } catch (err) {
        console.error('Error loading currency preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load currency');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    
    return () => { cancelled = true; };
  }, []);

  /**
   * Update user's preferred currency
   */
  const updateCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          preferred_currency: newCurrency,
          currency_symbol: CURRENCIES[newCurrency]?.symbol,
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setCurrency(newCurrency);
      setSymbol(CURRENCIES[newCurrency]?.symbol || '₹');
      setLocale(CURRENCIES[newCurrency]?.locale || 'en-IN');
      
      return { success: true };
    } catch (err) {
      console.error('Error updating currency:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update currency' 
      };
    }
  }, []);

  /**
   * Format amount using current currency settings
   */
  const format = useCallback((amount: number, options?: Intl.NumberFormatOptions): string => {
    return formatCurrency(amount, currency, options);
  }, [currency]);

  /**
   * Format amount with symbol prefix/postfix
   */
  const formatWithSymbol = useCallback((amount: number): string => {
    return formatCurrencyWithSymbol(amount, currency);
  }, [currency]);

  /**
   * Get short format for large amounts (e.g., 1.5K, 2.3M)
   */
  const formatShort = useCallback((amount: number): string => {
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
      return format(amount);
    }
    
    const formatted = shortValue.toLocaleString('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: shortValue % 1 === 0 ? 0 : 1,
    });
    
    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${formatted}${suffix}`;
  }, [format, symbol]);

  return {
    currency,
    symbol,
    locale,
    loading,
    error,
    format,
    formatWithSymbol,
    formatShort,
    updateCurrency,
    config: CURRENCIES[currency],
  };
}

/**
 * Hook to get all available currencies for selection UI
 */
export function useAvailableCurrencies() {
  return {
    currencies: Object.entries(CURRENCIES).map(([code, config]) => ({
      code: code as CurrencyCode,
      ...config,
    })),
    isValid: (code: string): boolean => code in CURRENCIES,
  };
}
