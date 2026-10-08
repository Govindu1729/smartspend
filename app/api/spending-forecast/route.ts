import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSpendingForecast } from '@/lib/spending-forecast';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const forecasts = await getSpendingForecast(user.id);
    return NextResponse.json({
      success: true,
      forecasts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating spending forecast:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
