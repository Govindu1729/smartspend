import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { sendBudgetAlerts } from '@/lib/budget-alerts';
import { createTransactionSchema, transactionQuerySchema, updateTransactionSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = transactionQuerySchema.safeParse({
    start: searchParams.get('start') || undefined,
    end: searchParams.get('end') || undefined,
    type: searchParams.get('type') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { start, end, type } = parsed.data;

  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select('*, categories(name, icon)')
    .eq('user_id', user.id)
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createTransactionSchema.safeParse(json);
  if (!parsed.success) {
    console.error('Validation Error:', parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  
  const { amount, type, category_id, description, date, is_recurring, recurring_interval } = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount,
      type,
      category_id: category_id || null, // Zod already converted "" to null, this is just a safety net
      description: description || null,
      date: date || new Date().toISOString().split('T')[0],
      is_recurring: is_recurring ?? false,
      recurring_interval: recurring_interval || null,
    })
    .select('*, categories(name, icon)')
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (type === 'expense' && category_id) {
    try {
      await sendBudgetAlerts(user.id, category_id);
    } catch (err) {
      console.error('Error sending budget alerts:', err);
    }
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateTransactionSchema.safeParse(json);
  if (!parsed.success) {
    console.error('Update Validation Error:', parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  
  const { id, ...updates } = parsed.data;

  // Remove undefined values so we don't overwrite existing data with nulls unintentionally
  Object.keys(updates).forEach((key) => {
    if (updates[key as keyof typeof updates] === undefined) {
      delete updates[key as keyof typeof updates];
    }
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, categories(name, icon)')
    .single();

  if (error) {
    console.error('Supabase Update Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}