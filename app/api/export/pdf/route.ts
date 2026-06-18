import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

interface TransactionRow {
  amount: number;
  type: string;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  categories?: { name: string } | null;
}

function generateReport(
  transactions: TransactionRow[],
  stats: { totalIncome: number; totalExpense: number; savingsRate: number },
  userName: string
): string {
  const lines: string[] = [];
  const now = new Date().toLocaleString('en-IN');

  lines.push('================================');
  lines.push('SMARTSPEND - TRANSACTION REPORT');
  lines.push('================================');
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push(`User: ${userName}`);
  lines.push('');

  lines.push('SUMMARY');
  lines.push('--------');
  lines.push(`Total Income:    INR ${stats.totalIncome.toLocaleString('en-IN')}`);
  lines.push(`Total Expenses:  INR ${stats.totalExpense.toLocaleString('en-IN')}`);
  lines.push(`Savings Rate:    ${stats.savingsRate}%`);
  lines.push('');

  lines.push('TRANSACTIONS');
  lines.push('------------');
  lines.push('');

  transactions.forEach((tx) => {
    lines.push(`Date: ${tx.date}`);
    lines.push(`Description: ${tx.description || 'N/A'}`);
    lines.push(`Category: ${tx.categories?.name || 'Uncategorized'}`);
    lines.push(`Type: ${tx.type.toUpperCase()}`);
    lines.push(`Amount: INR ${tx.amount.toLocaleString('en-IN')}`);
    lines.push(tx.is_recurring ? `Recurring: ${tx.recurring_interval || 'Yes'}` : 'Recurring: No');
    lines.push('---');
  });

  return lines.join('\n');
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format_type = searchParams.get('format') || 'pdf';

  const supabase = await createClient();

  const [{ data: profile }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
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
      .order('date', { ascending: false }),
  ]);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  const rows = (transactions || []) as unknown as TransactionRow[];

  const totalIncome = rows.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = rows.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const stats = { totalIncome, totalExpense, savingsRate };
  const userName = profile?.full_name || user.email || 'User';

  const content = generateReport(rows, stats, userName);

  const filename = `smartspend_transactions_${new Date().toISOString().split('T')[0]}.${format_type}`;

  // NOTE: This is a plain-text report. For a true PDF, add `pdfkit` and stream it.
  // We return text/plain (works for both .txt and .pdf for now) so the user
  // can still open/print it.
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    },
  });
}
