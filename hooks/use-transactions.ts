import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Transaction } from '@/types';

type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export function useTransactions(userId: string, limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    // NOTE: This still uses Supabase directly for read because RLS protects it
    // and it lets us use `.select('*, categories(name, icon)')` join easily.
    let query = supabase
      .from('transactions')
      .select('*, categories(name, icon)')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) {
      toast({
        title: 'Failed to load transactions',
        description: error.message,
        variant: 'destructive',
      });
    }
    setTransactions(data || []);
    setLoading(false);
  }, [userId, limit, supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: NewTransaction) => {
    const optimistic: Transaction = {
      id: `temp-${Date.now()}`,
      ...transaction,
      user_id: userId,
      created_at: new Date().toISOString(),
      categories: undefined,
    };
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
      // Rollback
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
      // Rollback
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
