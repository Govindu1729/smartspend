import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  return parseFloat(String(amountStr).replace(/[,₹"' ]/g, '')) || 0;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Try parsing as Excel date number
    const num = parseFloat(dateStr);
    if (!isNaN(num) && num > 40000 && num < 60000) {
      // Excel date serial number
      const date = new Date((num - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Try standard date parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  
  return dateStr;
}

function parsePhonePe(rows: any[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const row of rows) {
    if (!row || row.length < 4) continue;
    
    // Find columns by header names
    const dateStr = String(row[0] || '').trim();
    const description = String(row[2] || row[1] || '').trim();
    const typeStr = String(row[4] || row[3] || '').trim().toUpperCase();
    const amountStr = String(row[6] || row[5] || row[row.length - 1] || '').trim();
    
    if (!dateStr || !amountStr) continue;
    if (dateStr.toLowerCase().includes('date')) continue;
    
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;
    
    const isCredit = typeStr === 'CREDIT' || 
                     typeStr === 'C' || 
                     description.toLowerCase().includes('received') ||
                     description.toLowerCase().includes('credited');
    
    transactions.push({
      amount,
      type: isCredit ? 'income' : 'expense',
      description: description
        .replace(/Paid to |Paid by |Received from |Credited to /gi, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Imported transaction',
      date: parseDate(dateStr),
    });
  }
  
  return transactions;
}

function parseGeneric(rows: any[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  if (rows.length === 0) return transactions;
  
  // Find header row
  const headers = rows[0].map((h: any) => String(h || '').toLowerCase().trim());
  
  // Find column indices
  const findCol = (keywords: string[]): number => {
    return headers.findIndex((h: string) => 
      keywords.some(k => h.includes(k))
    );
  };
  
  const dateCol = findCol(['date', 'time', 'dated']);
  const descCol = findCol(['description', 'detail', 'particular', 'transaction details', 'name', 'narration']);
  const amountCol = findCol(['amount', 'value', 'sum']);
  const typeCol = findCol(['type', 'dr/cr', 'debit/credit', 'transaction type']);
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    const dateIdx = dateCol >= 0 ? dateCol : 0;
    const descIdx = descCol >= 0 ? descCol : 1;
    const amountIdx = amountCol >= 0 ? amountCol : (row.length - 1);
    const typeIdx = typeCol >= 0 ? typeCol : -1;
    
    const dateStr = String(row[dateIdx] || '').trim();
    const description = String(row[descIdx] || '').trim();
    const amountStr = String(row[amountIdx] || '').trim();
    const typeStr = typeIdx >= 0 ? String(row[typeIdx] || '').trim().toUpperCase() : '';
    
    if (!dateStr || !amountStr) continue;
    if (dateStr.toLowerCase().includes('date')) continue;
    
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;
    
    const isCredit = typeStr.includes('CREDIT') || 
                     typeStr.includes('C') || 
                     typeStr.includes('RECEIVED') ||
                     description.toLowerCase().includes('received');
    
    transactions.push({
      amount,
      type: isCredit ? 'income' : 'expense',
      description: description || 'Imported transaction',
      date: parseDate(dateStr),
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

    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    
    let rows: any[][] = [];
    
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      // Parse CSV
      const text = new TextDecoder().decode(buffer);
      rows = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => 
          line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(cell => cell.replace(/^["']|["']$/g, '').trim())
        );
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use CSV or XLSX.' }, { status: 400 });
    }

    if (rows.length < 1) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    // Detect format
    const firstRow = rows[0].map((c: any) => String(c || '').toLowerCase()).join(' ');
    const isPhonePe = firstRow.includes('phonepe') || 
                      firstRow.includes('utr') || 
                      firstRow.includes('transaction statement');
    
    let transactions: ParsedTransaction[];
    if (isPhonePe) {
      transactions = parsePhonePe(rows);
    } else {
      transactions = parseGeneric(rows);
    }

    if (transactions.length === 0) {
      return NextResponse.json({ 
        error: 'No transactions found. Check file format. First row should contain headers like Date, Description, Amount.' 
      }, { status: 400 });
    }

    // Insert into database
    let imported = 0;
    const errors: string[] = [];
    
    for (const txn of transactions) {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        date: txn.date,
      });
      
      if (error) {
        errors.push(`Failed: ${txn.description} - ${error.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: transactions.length,
      errors: errors.slice(0, 5),
      message: `Imported ${imported} of ${transactions.length} transactions`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
