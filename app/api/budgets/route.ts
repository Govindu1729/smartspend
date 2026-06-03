import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { format, startOfMonth } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const month = searchParams.get('month') || format(startOfMonth(new Date()), 'yyyy-MM-dd');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const { data: budgets, error } = await supabaseAdmin
    .from('budgets')
    .select('*, categories(name, icon)')
    .eq('user_id', userId)
    .eq('month', month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate spent amount for each budget
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget: any) => {
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', budget.category_id)
        .eq('type', 'expense')
        .gte('date', month)
        .lt('date', format(new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 1), 'yyyy-MM-dd'));

      const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      return { ...budget, spent };
    })
  );

  return NextResponse.json(budgetsWithSpent);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, category_id, month, amount, alert_threshold } = body;

  if (!user_id || !category_id || !month || !amount) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  // Upsert budget (create or update)
  const { data, error } = await supabaseAdmin
    .from('budgets')
    .upsert(
      { user_id, category_id, month, amount, alert_threshold: alert_threshold || 0.8 },
      { onConflict: 'user_id, category_id, month' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('budgets').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
