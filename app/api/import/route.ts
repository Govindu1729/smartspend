import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Parse different bank formats
function parseAmount(amountStr: string): number {
  // Remove commas, quotes, spaces
  return parseFloat(amountStr.replace(/[,₹"' ]/g, ''));
}

function detectFormat(headers: string[]): 'phonepe' | 'generic' {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('phonepe') || headerStr.includes('utr')) return 'phonepe';
  return 'generic';
}

function parsePhonePe(lines: string[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const row of lines) {
    if (row.length < 7) continue;
    
    const dateStr = row[0]?.trim();
    const description = row[2]?.trim();
    const type = row[4]?.trim();
    const amountStr = row[6]?.trim();
    
    if (!dateStr || !description || !amountStr) continue;
    if (dateStr.toLowerCase().includes('date')) continue; // skip header
    
    const amount = parseAmount(amountStr);
    const isCredit = type?.toUpperCase() === 'CREDIT' || description.toLowerCase().includes('received');
    
    // Parse date: "Jun 07, 2026"
    let date = dateStr;
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split('T')[0];
      }
    } catch {}
    
    transactions.push({
      amount,
      type: isCredit ? 'income' : 'expense',
      description: description.replace(/Paid to |Received from /gi, '').trim(),
      date,
    });
  }
  
  return transactions;
}

function parseGeneric(lines: string[][]): ParsedTransaction[] {
  // Try to find columns by header names
  const transactions: ParsedTransaction[] = [];
  
  for (const row of lines) {
    if (row.length < 3) continue;
    
    // Try to find date, description, amount columns
    let dateIdx = -1, descIdx = -1, amountIdx = -1, typeIdx = -1;
    
    row.forEach((cell, i) => {
      const c = cell.toLowerCase();
      if (c.includes('date') || /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(cell)) dateIdx = i;
      if (c.includes('description') || c.includes('detail') || c.includes('particular')) descIdx = i;
      if (c.includes('amount') || c.includes('debit') || c.includes('credit')) amountIdx = i;
      if (c.includes('type') || c.includes('dr/cr')) typeIdx = i;
    });
    
    if (dateIdx === -1) dateIdx = 0;
    if (descIdx === -1) descIdx = 1;
    if (amountIdx === -1) amountIdx = row.length - 1;
    
    const dateStr = row[dateIdx]?.trim();
    const description = row[descIdx]?.trim();
    const amountStr = row[amountIdx]?.trim();
    const typeStr = typeIdx !== -1 ? row[typeIdx]?.trim() : '';
    
    if (!dateStr || !amountStr) continue;
    
    const amount = parseAmount(amountStr);
    const isCredit = typeStr.toUpperCase().includes('CREDIT') || typeStr.toUpperCase().includes('C');
    
    transactions.push({
      amount,
      type: isCredit ? 'income' : 'expense',
      description: description || 'Imported transaction',
      date: dateStr,
    });
  }
  
  return transactions;
}

interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
}

function parseCSV(text: string): string[][] {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => 
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // Handle quoted commas
        .map(cell => cell.replace(/^["']|["']$/g, '').trim())
    );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = parseCSV(text);
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Empty or invalid file' }, { status: 400 });
    }

    const format = detectFormat(lines[0]);
    let transactions: ParsedTransaction[];
    
    if (format === 'phonepe') {
      transactions = parsePhonePe(lines);
    } else {
      transactions = parseGeneric(lines);
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found in file' }, { status: 400 });
    }

    // Insert into database
    let imported = 0;
    for (const txn of transactions) {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        date: txn.date,
      });
      
      if (!error) imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      total: transactions.length,
      message: `Imported ${imported} of ${transactions.length} transactions`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Check the format.' },
      { status: 500 }
    );
  }
}
