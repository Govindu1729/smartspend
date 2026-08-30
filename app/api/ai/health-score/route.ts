import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { calculateFinancialHealthScore } from '@/lib/groq';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { metrics } = json;

  if (!metrics) {
    return NextResponse.json(
      { error: 'Metrics required' },
      { status: 400 }
    );
  }

  try {
    const healthScore = await calculateFinancialHealthScore({
      totalIncome: metrics.totalIncome || 0,
      totalExpenses: metrics.totalExpenses || 0,
      savingsRate: metrics.savingsRate || 0,
      budgetCompliance: metrics.budgetCompliance || 0,
      emergencyFundMonths: metrics.emergencyFundMonths,
    });

    return NextResponse.json(healthScore);
  } catch (error: any) {
    console.error('Health score calculation error:', error);
    
    return NextResponse.json({
      score: 50,
      grade: 'C',
      strengths: ['Getting started with financial tracking'],
      improvements: ['Set up budgets', 'Track expenses consistently']
    });
  }
}
