import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';

interface TransactionRow {
  amount: number;
  type: string;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  categories?: { name: string } | null;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const [{ data: profile }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('transactions')
      .select(`
        amount, type, description, date, is_recurring, recurring_interval, categories(name)
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

  const userName = profile?.full_name || user.email || 'User';

  // Use a PassThrough stream to buffer the PDF in memory
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];
  
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Design Header
  doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold').text('SmartSpend Financial Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
  doc.text(`User: ${userName}`, { align: 'center' });
  doc.moveDown(1.5);

  // Summary Box
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Summary', 50, doc.y);
  doc.moveDown(0.5);
  doc.fillColor('#10b981').font('Helvetica-Bold').text(`Total Income:   ₹ ${totalIncome.toLocaleString('en-IN')}`, 50, doc.y);
  doc.fillColor('#ef4444').text(`Total Expenses: ₹ ${totalExpense.toLocaleString('en-IN')}`, 50, doc.y);
  doc.fillColor('#0f172a').text(`Savings Rate:   ${savingsRate}%`, 50, doc.y);
  
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.moveDown(1.5);

  // Transactions Table
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Transactions', 50, doc.y);
  doc.moveDown(0.5);

  // Table Header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
  doc.fillColor('#0f172a').rect(50, tableTop, 500, 16).fill('#0f172a');
  doc.fillColor('#ffffff').text('Date', 55, tableTop + 4);
  doc.text('Description', 130, tableTop + 4);
  doc.text('Category', 280, tableTop + 4);
  doc.text('Type', 380, tableTop + 4);
  doc.text('Amount', 470, tableTop + 4);
  
  let y = tableTop + 20;

  // Table Rows
  rows.forEach((tx) => {
    if (y > 780) { // Add page break if near bottom
      doc.addPage();
      y = 50;
    }
    
    const bgColor = tx.type === 'income' ? '#f0fdf4' : '#fef2f2';
    doc.rect(50, y - 2, 500, 16).fill(bgColor).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    
    doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
    doc.text(tx.date, 55, y + 2);
    doc.text(tx.description?.substring(0, 25) || 'N/A', 130, y + 2);
    doc.text(tx.categories?.name || 'Uncategorized', 280, y + 2);
    doc.text(tx.type.toUpperCase(), 380, y + 2);
    
    doc.fillColor(tx.type === 'income' ? '#10b981' : '#ef4444').font('Helvetica-Bold');
    doc.text(`₹${tx.amount.toLocaleString('en-IN')}`, 470, y + 2);
    
    y += 18;
  });

  doc.end();

  // Wait for the PDF stream to finish
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const filename = `smartspend_report_${new Date().toISOString().split('T')[0]}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}