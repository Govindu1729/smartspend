'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrencySymbol, formatCurrency } from '@/lib/utils';

/**
 * Read the authenticated user's preferred currency from `user.user_metadata.currency`.
 * Defaults to 'INR'. Re-fetches on mount and whenever the user changes.
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>('INR');
  const [symbol, setSymbol] = useState<string>('₹');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        const c = (user?.user_metadata?.currency as string) || 'INR';
        setCurrency(c);
        setSymbol(getCurrencySymbol(c));
      } catch {
        // ignore — defaults are fine
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    currency,
    symbol,
    loading,
    /** Format a number using the user's currency. */
    format: (amount: number) => formatCurrency(amount, currency),
  };
}
