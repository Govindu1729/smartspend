import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth, addMonths, isAfter } from 'date-fns';

export interface SpendingForecast {
  categoryId: string;
  categoryName: string;
  currentSpend: number;
  projectedSpend: number;
  daysRemaining: number;
  daysElapsed: number;
  pace: 'on_track' | 'ahead' | 'behind';
  alertAt: number | null;
}

export async function getSpendingForecast(userId: string): Promise<SpendingForecast[]> {
  const supabase = await createClient();

  // Get current month
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = daysInMonth - daysElapsed;

  // Get current month's transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('category_id, amount, date')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(today, 'yyyy-MM-dd'));

  // Get active budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('month', format(monthStart, 'yyyy-MM-dd'));

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Calculate spending per category
  const categorySpending: Record<string, number> = {};
  transactions.forEach((t) => {
    if (!t.category_id) return;
    categorySpending[t.category_id] = (categorySpending[t.category_id] || 0) + t.amount;
  });

  // Generate forecasts
  const forecasts: SpendingForecast[] = [];

  (budgets || []).forEach((budget) => {
    const currentSpend = categorySpending[budget.category_id] || 0;
    const dailyRate = currentSpend / daysElapsed;
    const projectedSpend = dailyRate * daysInMonth;
    const pace = projectedSpend > budget.amount * 1.1 
      ? 'behind' 
      : projectedSpend < budget.amount * 0.9 
      ? 'ahead' 
      : 'on_track';

    // Alert threshold: when do we expect to cross the budget?
    let alertAt: number | null = null;
    if (dailyRate > 0 && pace === 'behind') {
      const daysUntilBudget = budget.amount / dailyRate;
      alertAt = daysUntilBudget - daysElapsed;
    }

    forecasts.push({
      categoryId: budget.category_id,
      categoryName: budget.categories?.name || 'Unknown',
      currentSpend,
      projectedSpend,
      daysRemaining,
      daysElapsed,
      pace,
      alertAt: alertAt && alertAt > 0 ? alertAt : null,
    });
  });

  return forecasts;
}
