'use client';
import { useState, useEffect, useCallback } from 'react';

export interface BudgetAlertData {
  userId: string;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  currentSpend: number;
  percentage: number;
  threshold: number;
  shouldAlert: boolean;
}

export function useBudgetAlerts(userId: string) {
  const [alerts, setAlerts] = useState<BudgetAlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAlerts = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/budgets/check-alerts?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error checking budget alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkAlerts();

    // Check for alerts every 5 minutes
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

  return { alerts, loading, error, refresh: checkAlerts };
}
