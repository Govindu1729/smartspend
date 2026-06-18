import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[,₹"' ]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Handle Excel date serial number
    const num = parseFloat(dateStr);
    if (!isNaN(num) && num > 40000 && num < 60000) {
      const date = new Date((num - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Handle "Jun 07, 2026" format
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  
  return dateStr;
}

function findDataStartRow(rows: any[][]): number {
  // Look for the header row that contains "Date" and "Amount"
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const rowStr = rows[i]
      .map((c: any) => String(c || '').toLowerCase().trim())
      .join(' ');
    
    if ((rowStr.includes('date') && rowStr.includes('amount')) ||
        (rowStr.includes('date') && rowStr.includes('transaction'))) {
      return i; // This is the header row
    }
  }
  return 0;
}

function parsePhonePe(rows: any[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Find where actual data starts
  const headerRowIdx = findDataStartRow(rows);
  const headers = rows[headerRowIdx].map((h: any) => String(h || '').toLowerCase().trim());
  
  // Find column indices from headers
  const findCol = (keywords: string[]): number => {
    return headers.findIndex((h: string) => 
      keywords.some(k => h.includes(k))
    );
  };
  
  const dateCol = findCol(['date']);
  const descCol = findCol(['details', 'description', 'transaction details']);
  const typeCol = findCol(['type', 'transaction type']);
  const amountCol = findCol(['amount']);
  
  // If can't find amount column, use last column
  const effectiveAmountCol = amountCol >= 0 ? amountCol : (headers.length - 1);
  const effectiveDateCol = dateCol >= 0 ? dateCol : 0;
  const effectiveDescCol = descCol >= 0 ? descCol : 2;
  const effectiveTypeCol = typeCol >= 0 ? typeCol : 4;
  
  console.log(`PhonePe parser: dateCol=${effectiveDateCol}, descCol=${effectiveDescCol}, typeCol=${effectiveTypeCol}, amountCol=${effectiveAmountCol}`);
  
  // Process data rows (skip header)
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;
    
    const dateStr = String(row[effectiveDateCol] || '').trim();
    let description = String(row[effectiveDescCol] || '').trim();
    const typeStr = String(row[effectiveTypeCol] || '').trim().toUpperCase();
    const amountStr = String(row[effectiveAmountCol] || '').trim();
    
    // Skip empty rows, header rows, footer rows
    if (!dateStr || !amountStr) continue;
    if (dateStr.toLowerCase().includes('date')) continue;
    if (dateStr.toLowerCase().includes('duration')) continue;
    if (dateStr.toLowerCase().includes('statement')) continue;
    if (dateStr.toLowerCase().includes('disclaimer')) continue;
    
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;
    
    // Determine if credit or debit
    const isCredit = typeStr === 'CREDIT' || 
                     typeStr === 'C' || 
                     description.toLowerCase().includes('received from') ||
                     description.toLowerCase().includes('credited');
    
    // Clean up description
    description = description
      .replace(/Paid to /gi, '')
      .replace(/Received from /gi, '')
      .replace(/Credited to /gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!description) description = 'Imported transaction';
    
    transactions.push({
      amount,
      type: isCredit ? 'income' : 'expense',
      description,
      date: parseDate(dateStr),
    });
  }
  
  return transactions;
}

function parseGeneric(rows: any[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  if (rows.length === 0) return transactions;
  
  const headerRowIdx = findDataStartRow(rows);
  const headers = rows[headerRowIdx].map((h: any) => String(h || '').toLowerCase().trim());
  
  const findCol = (keywords: string[]): number => {
    return headers.findIndex((h: string) => 
      keywords.some(k => h.includes(k))
    );
  };
  
  const dateCol = findCol(['date', 'time', 'dated']);
  const descCol = findCol(['description', 'detail', 'particular', 'name', 'narration']);
  const amountCol = findCol(['amount', 'value', 'sum']);
  const typeCol = findCol(['type', 'dr/cr', 'debit/credit']);
  
  const effectiveDateCol = dateCol >= 0 ? dateCol : 0;
  const effectiveDescCol = descCol >= 0 ? descCol : 1;
  const effectiveAmountCol = amountCol >= 0 ? amountCol : (headers.length - 1);
  const effectiveTypeCol = typeCol >= 0 ? typeCol : -1;
  
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    const dateStr = String(row[effectiveDateCol] || '').trim();
    const description = String(row[effectiveDescCol] || '').trim();
    const amountStr = String(row[effectiveAmountCol] || '').trim();
    const typeStr = effectiveTypeCol >= 0 ? String(row[effectiveTypeCol] || '').trim().toUpperCase() : '';
    
    if (!dateStr || !amountStr) continue;
    if (dateStr.toLowerCase().includes('date')) continue;
    if (dateStr.toLowerCase().includes('disclaimer')) continue;
    
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;
    
    const isCredit = typeStr.includes('CREDIT') || 
                     typeStr.includes('C') || 
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
      const text = new TextDecoder().decode(buffer);
      rows = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => 
          line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(cell => cell.replace(/^["']|["']$/g, '').trim())
        );
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Use CSV or XLSX.' }, { status: 400 });
    }

    // Filter out completely empty rows
    rows = rows.filter((row: any[]) => 
      row.some((cell: any) => String(cell || '').trim() !== '')
    );

    if (rows.length < 2) {
      return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
    }

    // Detect format - PhonePe has specific patterns
    const allText = rows.slice(0, 5).map(r => 
      r.map((c: any) => String(c || '').toLowerCase()).join(' ')
    ).join(' ');
    
    const isPhonePe = allText.includes('phonepe') || 
                      allText.includes('utr') || 
                      allText.includes('transaction statement') ||
                      allText.includes('credit/debit instrument');
    
    console.log(`Detected format: ${isPhonePe ? 'PhonePe' : 'Generic'}, rows: ${rows.length}`);
    
    let transactions: ParsedTransaction[];
    if (isPhonePe) {
      transactions = parsePhonePe(rows);
    } else {
      transactions = parseGeneric(rows);
    }

    if (transactions.length === 0) {
      // Debug: show what we found
      const sample = rows.slice(0, 5).map(r => JSON.stringify(r)).join('\n');
      console.log('Sample rows:', sample);
      console.log('First row:', JSON.stringify(rows[0]));
      
      return NextResponse.json({ 
        error: 'No transactions found. The file may have an unexpected format. Try a different file or contact support.',
        debug: rows.length > 0 ? `Found ${rows.length} rows but no transactions. Headers found: ${rows[findDataStartRow(rows)]?.slice(0,5)?.join(', ')}` : 'No rows found'
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
        errors.push(`${txn.description}: ${error.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: transactions.length,
      errors: errors.slice(0, 3),
      message: `✅ Imported ${imported} of ${transactions.length} transactions!`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
