import { supabaseAdmin } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/notifications';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface BudgetAlert {
  userId: string;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  currentSpend: number;
  percentage: number;
  threshold: number;
  shouldAlert: boolean;
}

export async function checkBudgetAlerts(userId: string, categoryId?: string): Promise<BudgetAlert[]> {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  // Get all budgets for the user for current month
  let budgetQuery = supabaseAdmin
    .from('budgets')
    .select('id, category_id, amount, alert_threshold, categories(id, name)')
    .eq('user_id', userId)
    .gte('month', currentMonth)
    .lte('month', monthEnd);

  if (categoryId) {
    budgetQuery = budgetQuery.eq('category_id', categoryId);
  }

  const { data: budgets, error: budgetError } = await budgetQuery;

  if (budgetError || !budgets) {
    console.error('Error fetching budgets:', budgetError);
    return [];
  }

  const alerts: BudgetAlert[] = [];

  for (const budget of budgets) {
    // Get current spending for this category in current month
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', budget.category_id)
      .eq('type', 'expense')
      .gte('date', currentMonth)
      .lte('date', monthEnd);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      continue;
    }

    const currentSpend = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const percentage = (currentSpend / budget.amount) * 100;
    const threshold = (budget.alert_threshold || 0.8) * 100;

    const alert: BudgetAlert = {
      userId,
      categoryId: budget.category_id,
      categoryName: budget.categories?.name || 'Unknown',
      budgetAmount: budget.amount,
      currentSpend,
      percentage: Math.round(percentage),
      threshold: Math.round(threshold),
      shouldAlert: percentage >= (budget.alert_threshold || 0.8),
    };

    alerts.push(alert);
  }

  return alerts;
}

export async function sendBudgetAlerts(userId: string, categoryId?: string): Promise<number> {
  const alerts = await checkBudgetAlerts(userId, categoryId);
  let sentCount = 0;

  for (const alert of alerts) {
    if (alert.shouldAlert) {
      const status = alert.percentage >= 100 ? 'EXCEEDED' : 'APPROACHING';
      const message =
        status === 'EXCEEDED'
          ? `Budget Alert: You've exceeded your ${alert.categoryName} budget! (₹${alert.currentSpend.toLocaleString(
              'en-IN'
            )} spent out of ₹${alert.budgetAmount.toLocaleString('en-IN')})`
          : `Budget Alert: You've spent ${alert.percentage}% of your ${alert.categoryName} budget (₹${alert.currentSpend.toLocaleString(
              'en-IN'
            )} out of ₹${alert.budgetAmount.toLocaleString('en-IN')})`;

      try {
        await sendPushNotification(userId, {
          title: status === 'EXCEEDED' ? '💰 Budget Exceeded!' : '⚠️ Budget Alert',
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: {
            type: 'budget_alert',
            categoryId: alert.categoryId,
            categoryName: alert.categoryName,
            percentage: alert.percentage,
            status,
            url: '/budgets',
          },
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send budget alert for category ${alert.categoryName}:`, error);
      }
    }
  }

  return sentCount;
}
