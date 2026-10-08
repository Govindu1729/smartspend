import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getAnomalies } from '@/lib/anomaly-detection';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const anomalies = await getAnomalies(user.id);
    return NextResponse.json({
      success: true,
      anomalies,
      count: anomalies.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error detecting anomalies:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
