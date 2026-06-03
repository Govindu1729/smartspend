import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { description, userId } = await request.json();
  if (!description) return NextResponse.json({ category: null });

  // Fetch user's categories
  const { data: categories } = await supabaseAdmin.from('categories').select('id, name').eq('user_id', userId);
  const categoryNames = categories?.map(c => c.name).join(', ') || 'Food,Travel,Entertainment,Education,Shopping,Utilities,Health,Other';

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Classify this expense description into one of these categories: ${categoryNames}. Only reply with the exact category name.\nDescription: ${description}\nCategory:`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const catName = response.text().trim();
  const matched = categories?.find(c => c.name.toLowerCase() === catName.toLowerCase());
  return NextResponse.json({ category_id: matched?.id || null, category_name: matched?.name || catName });
}
