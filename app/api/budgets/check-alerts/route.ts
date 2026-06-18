import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { checkBudgetAlerts } from '@/lib/budget-alerts';
import { uuidSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryIdRaw = searchParams.get('category_id');
  const categoryId = categoryIdRaw
    ? uuidSchema.safeParse(categoryIdRaw).data ?? undefined
    : undefined;

  try {
    const alerts = await checkBudgetAlerts(user.id, categoryId);
    const alertsOnly = alerts.filter((a) => a.shouldAlert);

    return NextResponse.json({
      alerts: alertsOnly,
      count: alertsOnly.length,
      hasAlerts: alertsOnly.length > 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking budget alerts:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
