import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      amount,
      type,
      description,
      date,
      is_recurring,
      recurring_interval,
      categories(name)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .csv();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(transactions, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=smartspend_transactions_${new Date().toISOString().split('T')[0]}.csv`,
    },
  });
}
