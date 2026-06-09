import { NextRequest, NextResponse } from 'next/server';
import { checkBudgetAlerts } from '@/lib/budget-alerts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const categoryId = searchParams.get('category_id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const alerts = await checkBudgetAlerts(userId, categoryId || undefined);
    const alertsOnly = alerts.filter((a) => a.shouldAlert);

    return NextResponse.json({
      alerts: alertsOnly,
      count: alertsOnly.length,
      hasAlerts: alertsOnly.length > 0,
    });
  } catch (error: any) {
    console.error('Error checking budget alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
