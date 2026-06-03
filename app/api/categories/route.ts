import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, name, icon } = body;

  if (!user_id || !name) {
    return NextResponse.json({ error: 'User ID and name required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ user_id, name, icon: icon || 'tag', is_default: false })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, icon } = body;

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ name, icon })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
