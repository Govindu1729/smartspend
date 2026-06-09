import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Get current month data
  const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: currentMonthTransactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, type, category_id, categories(id, name)')
    .eq('user_id', userId)
    .gte('date', currentMonthStart)
    .lte('date', currentMonthEnd);

  const totalIncome = currentMonthTransactions
    ?.filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalExpense = currentMonthTransactions
    ?.filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Get top spending categories
  const categorySpending: { [key: string]: { name: string; value: number } } = {};
  currentMonthTransactions
    ?.filter((t) => t.type === 'expense')
    .forEach((t: any) => {
      const catName = t.categories?.name || 'Uncategorized';
      if (!categorySpending[catName]) {
        categorySpending[catName] = { name: catName, value: 0 };
      }
      categorySpending[catName].value += t.amount;
    });

  const topCategories = Object.values(categorySpending)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Get monthly trend for last 6 months
  const monthlyTrend: Array<{ month: string; income: number; expense: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = format(startOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');
    const monthLabel = format(subMonths(new Date(), i), 'MMM yy');

    const { data: monthData } = await supabaseAdmin
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const income = monthData?.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const expense = monthData?.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;

    monthlyTrend.push({ month: monthLabel, income, expense });
  }

  return NextResponse.json({ 
    totalIncome, 
    totalExpense, 
    savingsRate, 
    monthlyTrend,
    topCategories
  });
}
