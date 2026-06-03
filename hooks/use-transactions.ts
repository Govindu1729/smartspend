import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaction } from '@/types';

export function useTransactions(userId: string, limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('transactions').select('*, categories(name, icon)').eq('user_id', userId).order('date', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  }, [userId, limit, supabase]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const optimistic = { id: 'temp', ...transaction, user_id: userId, created_at: new Date().toISOString(), categories: undefined };
    setTransactions(prev => [optimistic, ...prev]);
    const { data, error } = await supabase.from('transactions').insert({ ...transaction, user_id: userId }).select('*, categories(name, icon)').single();
    if (error) { setTransactions(prev => prev.filter(t => t.id !== 'temp')); return; }
    setTransactions(prev => prev.map(t => t.id === 'temp' ? data : t));
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) fetchTransactions();
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refresh: fetchTransactions };
}
