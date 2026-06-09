import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { format } from 'date-fns';

// Helper function to create simple PDF (using text-based approach)
function generateSimplePDF(
  transactions: any[],
  stats: { totalIncome: number; totalExpense: number; savingsRate: number },
  userName: string
): string {
  const lines: string[] = [];
  const now = new Date().toLocaleString('en-IN');

  // Header
  lines.push('================================');
  lines.push('SMARTSPEND - TRANSACTION REPORT');
  lines.push('================================');
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push(`User: ${userName}`);
  lines.push('');

  // Summary Statistics
  lines.push('SUMMARY');
  lines.push('--------');
  lines.push(`Total Income:    ₹${stats.totalIncome.toLocaleString('en-IN')}`);
  lines.push(`Total Expenses:  ₹${stats.totalExpense.toLocaleString('en-IN')}`);
  lines.push(`Savings Rate:    ${stats.savingsRate}%`);
  lines.push('');

  // Transaction List
  lines.push('TRANSACTIONS');
  lines.push('--------');
  lines.push('');

  transactions.forEach((tx) => {
    lines.push(`Date: ${tx.date}`);
    lines.push(`Description: ${tx.description || 'N/A'}`);
    lines.push(`Category: ${tx.categories?.name || 'Uncategorized'}`);
    lines.push(`Type: ${tx.type.toUpperCase()}`);
    lines.push(`Amount: ₹${tx.amount.toLocaleString('en-IN')}`);
    lines.push(tx.is_recurring ? `Recurring: ${tx.recurring_interval}` : 'Recurring: No');
    lines.push('---');
  });

  lines.push('');
  lines.push('================================');
  lines.push('End of Report');
  lines.push('================================');

  return lines.join('\n');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const format_type = searchParams.get('format') || 'pdf'; // pdf or txt

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    // Fetch transactions
    const { data: transactions, error: txError } = await supabaseAdmin
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
      .order('date', { ascending: false });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // Calculate statistics
    const totalIncome =
      transactions?.filter((t: any) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpense =
      transactions?.filter((t: any) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    const stats = { totalIncome, totalExpense, savingsRate };
    const userName = profile?.full_name || 'User';

    // Generate content based on format
    const content = generateSimplePDF(transactions || [], stats, userName);

    if (format_type === 'txt') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename=smartspend_transactions_${new Date()
            .toISOString()
            .split('T')[0]}.txt`,
        },
      });
    }

    // For PDF, we'll return a simple text file that can be printed as PDF
    // A full PDF library like pdfkit would be needed for proper PDF generation
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename=smartspend_transactions_${new Date()
          .toISOString()
          .split('T')[0]}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
