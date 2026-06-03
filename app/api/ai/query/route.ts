import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { query: userQuery, userId } = await request.json();

  // Fetch transactions, categories, budgets for context
  const { data: transactions } = await supabaseAdmin.from('transactions').select('amount, type, date, categories(name)').eq('user_id', userId);
  const { data: budgets } = await supabaseAdmin.from('budgets').select('amount, month, categories(name)').eq('user_id', userId);

  const context = {
    transactions: transactions?.map(t => ({
      amount: t.amount, type: t.type, date: t.date, category: t.categories?.name || 'Uncategorized'
    })),
    budgets: budgets?.map(b => ({
      category: b.categories?.name, amount: b.amount, month: b.month
    }))
  };

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `You are a personal finance assistant. Answer the user's question based on this data:\n${JSON.stringify(context)}\nUser question: ${userQuery}\nAnswer in a friendly tone, include rupee amounts where relevant.`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return NextResponse.json({ answer: response.text() });
}
