import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { aiQuerySchema } from '@/lib/schemas';
import { answerFinancialQuery } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = aiQuerySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid question.' }, { status: 400 });
  }
  const userQuery = parsed.data.query;

  const supabase = await createClient();

  const [{ data: transactions }, { data: budgets }] = await Promise.all([
    supabase.from('transactions').select('amount, type, date, categories(name)').eq('user_id', user.id).order('date', { ascending: false }).limit(500),
    supabase.from('budgets').select('amount, month, categories(name)').eq('user_id', user.id),
  ]);

  type TxRow = { amount: number; type: string; date: string; categories: { name: string } | null };
  type BudgetRow = { amount: number; month: string; categories: { name: string } | null };

  const context = {
    transactions: ((transactions || []) as unknown as TxRow[]).map((t) => ({
      amount: t.amount, type: t.type, date: t.date, category: t.categories?.name || 'Uncategorized',
    })),
    budgets: ((budgets || []) as unknown as BudgetRow[]).map((b) => ({
      category: b.categories?.name, amount: b.amount, month: b.month,
    })),
  };

  try {
    const answer = await answerFinancialQuery(userQuery, context);
    return NextResponse.json({ answer });
  } catch (error: any) {
    const msg = error?.message || String(error);
    
    // Map common errors to friendly messages
    if (msg.includes('429') || msg.includes('rate') || msg.includes('quota')) {
      return NextResponse.json({ 
        answer: '🤖 The AI is experiencing high traffic right now. Please try again in a minute.' 
      });
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('key')) {
      return NextResponse.json({ 
        answer: '🔧 AI service is being configured. Please check back soon!' 
      });
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return NextResponse.json({ 
        answer: '⏳ The AI took too long to respond. Try a simpler question or try again.' 
      });
    }
    
    console.error('AI query error:', msg);
    return NextResponse.json({ 
      answer: '😕 Something went wrong. Please try rephrasing your question or try again later.' 
    });
  }
}
