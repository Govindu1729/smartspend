import { createClient } from '@/lib/supabase/server';

export interface EmailSubscription {
  id: string;
  user_id: string;
  email: string;
  frequency: 'weekly' | 'monthly';
  categories: string[] | null;
  enabled: boolean;
  created_at: string;
}

export async function getOrCreateSubscription(userId: string): Promise<EmailSubscription> {
  const supabase = await createClient();
  
  // Check if subscription exists
  const { data: existing } = await supabase
    .from('email_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new subscription
  const { data, error } = await supabase
    .from('email_subscriptions')
    .insert({
      user_id: userId,
      email: '', // Empty by default, user needs to set it
      frequency: 'weekly',
      enabled: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateSubscription(
  userId: string,
  updates: Partial<Pick<EmailSubscription, 'email' | 'frequency' | 'enabled'>>
): Promise<EmailSubscription> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('email_subscriptions')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendWeeklySummary(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('email_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .maybeSingle();

  if (!subscription || !subscription.email) {
    return false;
  }

  // Get this week's transactions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startOfWeek.toISOString().split('T')[0]);

  if (!transactions || transactions.length === 0) {
    return false;
  }

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Save to transaction history (for tracking)
  await supabase
    .from('weekly_summaries')
    .insert({
      user_id: userId,
      week_start: startOfWeek.toISOString().split('T')[0],
      total_income: totalIncome,
      total_expense: totalExpense,
      transaction_count: transactions.length,
    });

  return true;
}
