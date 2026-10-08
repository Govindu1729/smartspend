import { createClient } from '@/lib/supabase/server';
import { format, subDays, addMonths } from 'date-fns';

export interface TransactionAnomaly {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export async function getAnomalies(userId: string): Promise<TransactionAnomaly[]> {
  const supabase = await createClient();

  // Get transactions from last 30 days
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, amount, description, date, category_id, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', thirtyDaysAgo)
    .lte('date', today);

  if (!recentTransactions || recentTransactions.length < 5) {
    return [];
  }

  // Calculate statistics
  const amounts = recentTransactions.map((t) => t.amount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amount) => sum + Math.pow(amount - avg, 2), 0) / amounts.length
  );

  const anomalies: TransactionAnomaly[] = [];

  recentTransactions.forEach((t) => {
    // Z-score: how many standard deviations from mean?
    const zScore = stdDev > 0 ? (t.amount - avg) / stdDev : 0;
    
    // Check if significantly higher than average (> 2 std devs)
    if (zScore > 2) {
      const severity = zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
      anomalies.push({
        id: t.id,
        amount: t.amount,
        description: t.description || 'Unknown transaction',
        date: t.date,
        category: t.categories?.name || 'Uncategorized',
        severity,
        message: `This ${t.amount.toLocaleString('en-IN')} ${t.categories?.name || 'transaction'} is ${(zScore * 100).toFixed(0)}% above your typical daily spend.`,
      });
    }

    // Also check if it's a very large amount relative to category budget
    const monthlyStart = format(addMonths(new Date(), -1), 'yyyy-MM-dd');
    const { data: monthlyTx } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', t.category_id || '')
      .eq('type', 'expense')
      .gte('date', monthlyStart);

    if (monthlyTx && monthlyTx.length > 1) {
      const monthlyTotal = monthlyTx.reduce((sum, m) => sum + m.amount, 0);
      const percentage = (t.amount / monthlyTotal) * 100;
      
      if (percentage > 30) {
        anomalies.push({
          id: t.id,
          amount: t.amount,
          description: t.description || 'Unknown transaction',
          date: t.date,
          category: t.categories?.name || 'Uncategorized',
          severity: percentage > 50 ? 'high' : 'medium',
          message: `This single transaction represents ${(percentage.toFixed(0))}% of your total ${t.categories?.name || 'this category'} spending this month.`,
        });
      }
    }
  });

  // Sort by severity
  const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  return anomalies.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
}
