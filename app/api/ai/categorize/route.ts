import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { aiCategorizeSchema } from '@/lib/schemas';
import { categorizeTransaction } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = aiCategorizeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { description } = parsed.data;

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id);

  const categoryNames =
    categories?.map((c) => c.name).join(', ') ||
    'Food,Travel,Entertainment,Education,Shopping,Utilities,Health,Other';

  const catName = await categorizeTransaction(description, categoryNames);
  const matched = categories?.find(
    (c) => c.name.toLowerCase() === (catName || '').toLowerCase()
  );

  return NextResponse.json({
    category_id: matched?.id || null,
    category_name: matched?.name || catName || null,
  });
}
