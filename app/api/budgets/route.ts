import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { createBudgetSchema, updateBudgetSchema, uuidSchema } from '@/lib/schemas';
import { format, startOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month =
    searchParams.get('month') || format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const supabase = await createClient();

  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('*, categories(name, icon)')
    .eq('user_id', user.id)
    .eq('month', month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!budgets || budgets.length === 0) {
    return NextResponse.json([]);
  }

  // Single query for ALL category spend this month, then group in JS — fixes N+1
  const monthStart = month;
  const monthEnd = format(
    new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0),
    'yyyy-MM-dd'
  );
  const categoryIds = budgets.map((b) => b.category_id);

  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', user.id)
    .in('category_id', categoryIds)
    .eq('type', 'expense')
    .gte('date', monthStart)
    .lte('date', monthEnd);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  const spendByCategory: Record<string, number> = {};
  (txData || []).forEach((t: { category_id: string; amount: number }) => {
    spendByCategory[t.category_id] = (spendByCategory[t.category_id] || 0) + t.amount;
  });

  const budgetsWithSpent = budgets.map((budget) => ({
    ...budget,
    spent: spendByCategory[budget.category_id] || 0,
  }));

  return NextResponse.json(budgetsWithSpent);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Inside app/api/budgets/route.ts -> POST function

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // FIX: Convert string numbers to actual numbers
  if (json.amount) json.amount = Number(json.amount);
  if (json.alert_threshold) json.alert_threshold = Number(json.alert_threshold);
  const parsed = createBudgetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { category_id, month, amount, alert_threshold } = parsed.data;

  const supabase = await createClient();

  // Verify category belongs to the user before upserting
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('id')
    .eq('id', category_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (catErr) {
    return NextResponse.json({ error: catErr.message }, { status: 500 });
  }
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: user.id,
        category_id,
        month,
        amount,
        alert_threshold: alert_threshold ?? 0.8,
      },
      { onConflict: 'user_id, category_id, month' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const parsed = updateBudgetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...updates } = parsed.data;

  const patch: Record<string, unknown> = {};
  if (updates.amount !== undefined) patch.amount = updates.amount;
  if (updates.alert_threshold !== undefined) patch.alert_threshold = updates.alert_threshold;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
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
  const idRaw = searchParams.get('id');
  const parsed = uuidSchema.safeParse(idRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid budget ID' }, { status: 400 });
  }
  const id = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
