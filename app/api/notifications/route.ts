import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas';

// GET /api/notifications
// Optional query params: ?unread=true (only unread), ?limit=50 (default 50)
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const onlyUnread = searchParams.get('unread') === 'true';
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.min(parseInt(limitRaw, 10) || 50, 200) : 50;

  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (onlyUnread) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also return unread count for badge display
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return NextResponse.json({ notifications: data || [], unreadCount: count || 0 });
}

// POST /api/notifications
// Body: { action: "mark_read" | "mark_all_read" | "delete" | "clear_all", id?: string }
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, id } = json as { action?: string; id?: string };
  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const supabase = await createClient();

  switch (action) {
    case 'mark_read': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const parsed = uuidSchema.safeParse(id);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', parsed.data)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'mark_all_read': {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const parsed = uuidSchema.safeParse(id);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', parsed.data)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case 'clear_all': {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
