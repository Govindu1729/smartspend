import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
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

  const supabase = await createClient();

  let budgetQuery = supabase
    .from('budgets')
    .select('id, category_id, amount, alert_threshold, categories(id, name)')
    .eq('user_id', userId)
    .gte('month', currentMonth)
    .lte('month', monthEnd);

  if (categoryId) {
    budgetQuery = budgetQuery.eq('category_id', categoryId);
  }

  const { data: budgets, error: budgetError } = await budgetQuery;

  if (budgetError || !budgets || budgets.length === 0) {
    if (budgetError) console.error('Error fetching budgets:', budgetError);
    return [];
  }

  // Single query for all the user's expenses this month, grouped in JS — fixes N+1
  const categoryIds = budgets.map((b) => b.category_id);
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', userId)
    .in('category_id', categoryIds)
    .eq('type', 'expense')
    .gte('date', currentMonth)
    .lte('date', monthEnd);

  if (txError) {
    console.error('Error fetching transactions:', txError);
    return [];
  }

  const spendByCategory: Record<string, number> = {};
  (transactions || []).forEach((t: { category_id: string; amount: number }) => {
    spendByCategory[t.category_id] = (spendByCategory[t.category_id] || 0) + t.amount;
  });

  // Cast: Supabase's TS inference treats FK joins as arrays, but at runtime
  // `categories` is a single object (or null) for this query.
  type BudgetRow = {
    id: string;
    category_id: string;
    amount: number;
    alert_threshold: number | null;
    categories: { id: string; name: string } | null;
  };
  const typedBudgets = (budgets as unknown as BudgetRow[]);

  const alerts: BudgetAlert[] = typedBudgets.map((budget) => {
    const currentSpend = spendByCategory[budget.category_id] || 0;
    const thresholdPct = (budget.alert_threshold || 0.8) * 100;
    const percentage = budget.amount > 0 ? (currentSpend / budget.amount) * 100 : 0;

    return {
      userId,
      categoryId: budget.category_id,
      categoryName: budget.categories?.name || 'Unknown',
      budgetAmount: budget.amount,
      currentSpend,
      percentage: Math.round(percentage),
      threshold: Math.round(thresholdPct),
      shouldAlert: percentage >= (budget.alert_threshold || 0.8),
    };
  });

  return alerts;
}

export async function sendBudgetAlerts(userId: string, categoryId?: string): Promise<number> {
  const alerts = await checkBudgetAlerts(userId, categoryId);
  if (alerts.length === 0) return 0;

  // 1. Persist alert rows to the notifications table (in-app Notifications page)
  const admin = getSupabaseAdmin();
  const rowsToInsert = alerts
    .filter((a) => a.shouldAlert)
    .map((alert) => ({
      user_id: userId,
      type: alert.percentage >= 100 ? ('budget_exceeded' as const) : ('budget_alert' as const),
      title: alert.percentage >= 100
        ? `Budget Exceeded: ${alert.categoryName}`
        : `Budget Alert: ${alert.categoryName}`,
      body: `You've spent ${alert.percentage}% of your ${alert.categoryName} budget (INR ${alert.currentSpend.toLocaleString('en-IN')} / INR ${alert.budgetAmount.toLocaleString('en-IN')}).`,
      category_name: alert.categoryName,
      percentage: alert.percentage,
      amount: alert.currentSpend,
      is_read: false,
    }));

  if (rowsToInsert.length > 0) {
    const { error: insertErr } = await admin
      .from('notifications')
      .insert(rowsToInsert);
    if (insertErr) {
      console.error('Failed to persist notifications:', insertErr);
      // Continue — push notifications can still fire
    }
  }

  // 2. Fire push notifications
  let sentCount = 0;
  for (const alert of alerts) {
    if (!alert.shouldAlert) continue;

    const status = alert.percentage >= 100 ? 'EXCEEDED' : 'APPROACHING';
    const message =
      status === 'EXCEEDED'
        ? `Budget Alert: You've exceeded your ${alert.categoryName} budget! (INR ${alert.currentSpend.toLocaleString(
            'en-IN'
          )} spent out of INR ${alert.budgetAmount.toLocaleString('en-IN')})`
        : `Budget Alert: You've spent ${alert.percentage}% of your ${alert.categoryName} budget (INR ${alert.currentSpend.toLocaleString(
            'en-IN'
          )} out of INR ${alert.budgetAmount.toLocaleString('en-IN')})`;

    try {
      await sendPushNotification(userId, {
        title: status === 'EXCEEDED' ? 'Budget Exceeded' : 'Budget Alert',
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

  return sentCount;
}
