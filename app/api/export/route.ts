import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: transactions, error } = await supabase
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
    .eq('user_id', user.id)
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
