import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId, subscription } = await request.json();

  if (!userId || !subscription) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { endpoint, keys } = subscription;

  // Check if subscription already exists
  const { data: existing } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (existing) {
    return NextResponse.json({ message: 'Already subscribed' });
  }

  const { error } = await supabaseAdmin.from('push_subscriptions').insert({
    user_id: userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Subscribed successfully' });
}
