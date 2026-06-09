import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Delete user's data from transactions table
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id);

    // Delete user's data from budgets table
    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id);

    // Delete user's data from categories table
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', user.id);

    // Delete the user account itself
    // Note: This requires the admin API or you can use the user delete endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
