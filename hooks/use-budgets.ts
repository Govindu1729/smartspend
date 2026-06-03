'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Budget } from '@/types';

export function useBudgets(userId: string) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/budgets?user_id=${userId}`);
      const data = await response.json();
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (budgetData: Omit<Budget, 'id'>) => {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...budgetData, user_id: userId }),
    });
    const data = await response.json();
    if (!data.error) {
      setBudgets([...budgets, data]);
    }
    return data;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const response = await fetch('/api/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await response.json();
    if (!data.error) {
      setBudgets(budgets.map((b) => (b.id === id ? data : b)));
    }
  };

  const deleteBudget = async (id: string) => {
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const checkAlerts = async () => {
    const response = await fetch(`/api/budgets/check?user_id=${userId}`);
    const data = await response.json();
    return data;
  };

  return { budgets, loading, addBudget, updateBudget, deleteBudget, checkAlerts, refresh: fetchBudgets };
}
