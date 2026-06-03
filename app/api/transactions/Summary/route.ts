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
    .select('amount, type')
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

  // Get monthly trend for last 6 months
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = format(startOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(subMonths(new Date(), i)), 'yyyy-MM-dd');
    const monthLabel = format(subMonths(new Date(), i), 'MMM yy');

    const { data: monthData } = await supabaseAdmin
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date',
