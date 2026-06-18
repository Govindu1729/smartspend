import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get current month data
  const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: currentMonthTransactions, error } = await supabase
    .from('transactions')
    .select('amount, type, category_id, categories(id, name)')
    .eq('user_id', user.id)
    .gte('date', currentMonthStart)
    .lte('date', currentMonthEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalIncome =
    currentMonthTransactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalExpense =
    currentMonthTransactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Get top spending categories
  const categorySpending: { [key: string]: { name: string; value: number } } = {};
  // Cast: Supabase's TS inference treats FK joins as arrays, but at runtime
  // `categories` is a single object (or null) for this query.
  type TxRow = {
    amount: number;
    type: string;
    category_id: string;
    categories: { id: string; name: string } | null;
  };
  ((currentMonthTransactions || []) as unknown as TxRow[])
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const catName = t.categories?.name || 'Uncategorized';
      if (!categorySpending[catName]) {
        categorySpending[catName] = { name: catName, value: 0 };
      }
      categorySpending[catName].value += t.amount;
    });

  const topCategories = Object.values(categorySpending)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Get monthly trend for last 6 months — single query instead of N+1
  const sixMonthsAgoStart = format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd');
  const { data: trendData, error: trendError } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgoStart)
    .lte('date', currentMonthEnd);

  if (trendError) {
    return NextResponse.json({ error: trendError.message }, { status: 500 });
  }

  const monthlyTrend: Array<{ month: string; income: number; expense: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    const monthLabel = format(subMonths(new Date(), i), 'MMM yy');

    const monthTx = (trendData || []).filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const income = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    monthlyTrend.push({ month: monthLabel, income, expense });
  }

  return NextResponse.json({
    totalIncome,
    totalExpense,
    savingsRate,
    monthlyTrend,
    topCategories,
  });
}
