import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBudgetAlerts } from '@/lib/budget-alerts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const type = searchParams.get('type');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select('*, categories(name, icon)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (start) query = query.gte('date', start);
  if (end) query = query.lte('date', end);
  if (type && type !== 'all') query = query.eq('type', type);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, amount, type, category_id, description, date, is_recurring, recurring_interval } = body;

  if (!user_id || !amount || !type) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id,
      amount,
      type,
      category_id,
      description,
      date: date || new Date().toISOString().split('T')[0],
      is_recurring: is_recurring || false,
      recurring_interval,
    })
    .select('*, categories(name, icon)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check budget alerts after adding expense
  if (type === 'expense' && category_id) {
    try {
      await sendBudgetAlerts(user_id, category_id);
    } catch (err) {
      console.error('Error sending budget alerts:', err);
      // Don't fail the transaction creation if alerts fail
    }
  }

  return NextResponse.json(data);
}
