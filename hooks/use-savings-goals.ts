/**
 * Savings Goals Hook
 * 
 * Manages savings goals with CRUD operations and progress tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SavingsGoal, GoalContribution } from '@/types';

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (cancelled) return;
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('priority', { ascending: true })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Calculate progress for each goal
        const goalsWithProgress = (data || []).map(goal => ({
          ...goal,
          progress_percentage: goal.target_amount > 0 
            ? (goal.current_amount / goal.target_amount) * 100 
            : 0,
          remaining_amount: goal.target_amount - goal.current_amount,
          days_remaining: goal.deadline 
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined,
        }));

        setGoals(goalsWithProgress as SavingsGoal[]);
      } catch (err) {
        console.error('Error loading savings goals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    
    return () => { cancelled = true; };
  }, []);

  /**
   * Create a new savings goal
   */
  const createGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          name: goal.name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount || 0,
          deadline: goal.deadline,
          icon: goal.icon || '🎯',
          color: goal.color || '#3b82f6',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setGoals(prev => [...prev, data as SavingsGoal]);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating savings goal:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create goal',
      };
    }
  }, []);

  /**
   * Update an existing savings goal
   */
  const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error: updateError } = await supabase
        .from('savings_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setGoals(prev => prev.map(g => g.id === id ? (data as SavingsGoal) : g));
      return { success: true, data };
    } catch (err) {
      console.error('Error updating savings goal:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update goal',
      };
    }
  }, []);

  /**
   * Delete a savings goal
   */
  const deleteGoal = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setGoals(prev => prev.filter(g => g.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting savings goal:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete goal',
      };
    }
  }, []);

  /**
   * Add contribution to a savings goal
   */
  const addContribution = useCallback(async (goalId: string, amount: number, note?: string, transactionId?: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Insert contribution record
      const { error: contribError } = await supabase
        .from('goal_contributions')
        .insert({
          goal_id: goalId,
          amount,
          note,
          transaction_id: transactionId,
        });

      if (contribError) throw contribError;

      // Update goal's current_amount
      const { data: goal, error: goalError } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();

      if (goalError) throw goalError;

      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: (goal.current_amount || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Refresh goals list
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          const newAmount = (g.current_amount || 0) + amount;
          return {
            ...g,
            current_amount: newAmount,
            progress_percentage: g.target_amount > 0 ? (newAmount / g.target_amount) * 100 : 0,
            remaining_amount: g.target_amount - newAmount,
          };
        }
        return g;
      }));

      return { success: true };
    } catch (err) {
      console.error('Error adding contribution:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add contribution',
      };
    }
  }, []);

  /**
   * Get contributions for a specific goal
   */
  const getContributions = useCallback(async (goalId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', goalId)
        .order('contributed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data as GoalContribution[] };
    } catch (err) {
      console.error('Error loading contributions:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load contributions',
      };
    }
  }, []);

  /**
   * Get total savings across all active goals
   */
  const getTotalSavings = useCallback((): number => {
    return goals
      .reduce((sum, g) => sum + (g.current_amount || 0), 0);
  }, [goals]);

  /**
   * Get goals by completion status
   */
  const getGoalsByStatus = useCallback((status: 'completed' | 'active' | 'overdue') => {
    const now = new Date();
    
    switch (status) {
      case 'completed':
        return goals.filter(g => g.current_amount >= g.target_amount);
      case 'overdue':
        return goals.filter(g => 
          g.deadline && 
          new Date(g.deadline) < now && 
          g.current_amount < g.target_amount
        );
      default:
        return goals.filter(g => 
          g.current_amount < g.target_amount
        );
    }
  }, [goals]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    getContributions,
    getTotalSavings,
    getGoalsByStatus,
  };
}

/**
 * Quick hook for single goal management
 */
export function useSavingsGoal(goalId: string) {
  const { goals, updateGoal, deleteGoal, addContribution, getContributions } = useSavingsGoals();
  
  const goal = goals.find(g => g.id === goalId);
  
  const update = useCallback(async (updates: Partial<SavingsGoal>) => {
    return updateGoal(goalId, updates);
  }, [goalId, updateGoal]);
  
  const remove = useCallback(async () => {
    return deleteGoal(goalId);
  }, [goalId, deleteGoal]);
  
  const contribute = useCallback(async (amount: number, note?: string) => {
    return addContribution(goalId, amount, note);
  }, [goalId, addContribution]);
  
  const contributions = useCallback(async () => {
    return getContributions(goalId);
  }, [goalId, getContributions]);

  return {
    goal,
    update,
    remove,
    contribute,
    contributions,
  };
}
