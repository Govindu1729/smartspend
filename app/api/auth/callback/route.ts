import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // FIX: Auto-seed default categories for OAuth users if they don't exist
      const { data: existingCats } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', data.user.id);

      if (!existingCats || existingCats.length === 0) {
        const defaultCategories = [
          { name: 'Food', icon: 'utensils' },
          { name: 'Travel', icon: 'car' },
          { name: 'Entertainment', icon: 'film' },
          { name: 'Education', icon: 'book' },
          { name: 'Shopping', icon: 'shopping-bag' },
          { name: 'Utilities', icon: 'zap' },
          { name: 'Health', icon: 'heart' },
          { name: 'Other', icon: 'tag' },
        ];

        await supabase.from('categories').insert(
          defaultCategories.map((cat) => ({
            user_id: data.user.id,
            name: cat.name,
            icon: cat.icon,
            is_default: true,
          }))
        );
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Return to login if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}