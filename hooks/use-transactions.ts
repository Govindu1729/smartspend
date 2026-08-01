import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { Transaction } from '@/types';

type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export function useTransactions(userId?: string, limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return; // Don't fetch if userId isn't ready yet
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load transactions');
      const data: Transaction[] = await res.json();
      setTransactions(limit ? data.slice(0, limit) : data);
    } catch (err) {
      toast({
        title: 'Failed to load transactions',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: NewTransaction) => {
    const optimistic: Transaction = {
      id: `temp-${Date.now()}`,
      ...transaction,
      user_id: userId || '',
      created_at: new Date().toISOString(),
      categories: undefined,
    } as Transaction;
    
    setTransactions((prev) => [optimistic, ...prev]);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data: Transaction = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === optimistic.id ? data : t)));
      toast({ title: 'Transaction added', description: `${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toLocaleString('en-IN')}` });
    } catch (err) {
      setTransactions((prev) => prev.filter((t) => t.id !== optimistic.id));
      toast({
        title: 'Failed to add transaction',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const prev = transactions;
    setTransactions((curr) => curr.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data: Transaction = await res.json();
      setTransactions((curr) => curr.map((t) => (t.id === id ? data : t)));
      toast({ title: 'Transaction updated' });
    } catch (err) {
      setTransactions(prev);
      toast({
        title: 'Failed to update transaction',
        description: err instanceof Error ? err.message : 'Unknown error — reverted',
        variant: 'destructive',
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    const prev = transactions;
    setTransactions((curr) => curr.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      toast({ title: 'Transaction deleted' });
    } catch (err) {
      setTransactions(prev);
      toast({
        title: 'Failed to delete transaction',
        description: err instanceof Error ? err.message : 'Unknown error — reverted',
        variant: 'destructive',
      });
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}