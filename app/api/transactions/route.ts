import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  if (type === 'expense') {
    try {
      const { data: alerts } = await supabase.rpc('check_budget_alerts');
      if (alerts && alerts.length > 0) {
        const userAlert = alerts.find((a: any) => a.user_id === user_id);
        if (userAlert) {
          // Trigger push notification
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user_id,
              message: `Budget alert: You've spent ${userAlert.percent}% of your ${userAlert.category} budget!`,
            }),
          });
        }
      }
    } catch (err) {
      console.error('Error checking budget alerts:', err);
    }
  }

  return NextResponse.json(data);
}
