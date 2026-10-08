import { createClient } from '@/lib/supabase/server';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { callAI } from './ai';

export interface BudgetRecommendation {
  categoryId: string;
  categoryName: string;
  currentBudget: number;
  recommendedBudget: number;
  spendHistory: number[];
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
}

export async function getBudgetRecommendations(userId: string): Promise<BudgetRecommendation[]> {
  const supabase = await createClient();

  // Get all categories for this user
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (!categories || categories.length === 0) {
    return [];
  }

  // Get 6 months of spending history per category
  const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd');
  const today = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: transactions } = await supabase
    .from('transactions')
    .select('category_id, amount, date')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', sixMonthsAgo)
    .lte('date', today);

  // Build spending history per category
  const spendingHistory: Record<string, number[]> = {};
  const currentBudgets: Record<string, number> = {};

  categories.forEach((cat) => {
    spendingHistory[cat.id] = [];
  });

  // Group by month
  const monthlySpending: Record<string, Record<string, number>> = {};
  
  transactions?.forEach((t) => {
    if (!t.category_id) return;
    const month = format(new Date(t.date), 'yyyy-MM');
    if (!monthlySpending[month]) {
      monthlySpending[month] = {};
    }
    if (!monthlySpending[month][t.category_id]) {
      monthlySpending[month][t.category_id] = 0;
    }
    monthlySpending[month][t.category_id] += t.amount;
  });

  // Create arrays for each category
  const months = Object.keys(monthlySpending).sort();
  months.forEach((month) => {
    categories.forEach((cat) => {
      if (monthlySpending[month][cat.id] !== undefined) {
        spendingHistory[cat.id].push(monthlySpending[month][cat.id]);
      }
    });
  });

  // Generate AI-powered recommendations
  const recommendations: BudgetRecommendation[] = [];

  for (const cat of categories) {
    const history = spendingHistory[cat.id] || [];
    
    // Skip if insufficient data
    if (history.length < 2) {
      continue;
    }

    // Calculate average and trend
    const avgSpending = history.reduce((a, b) => a + b, 0) / history.length;
    const hasIncreasingTrend = history.length >= 3 && history[history.length - 1] > history[0];
    const variance = avgSpending > 0 
      ? (history[Math.floor(history.length / 2)] - avgSpending) / avgSpending 
      : 0;

    // Use AI to generate personalized recommendation
    try {
      const prompt = `
You are a financial advisor. Based on this spending data for category "${cat.name}":
- Average monthly spending: ₹${avgSpending.toFixed(0)}
- Spending trend: ${hasIncreasingTrend ? 'increasing' : 'stable/decreasing'}
- Number of months tracked: ${history.length}

Recommend a monthly budget amount. Be conservative but realistic. Return JSON:
{
  "recommended_budget": number,
  "rationale": "explanation"
}`;

      const response = await callAI(prompt);
      const data = JSON.parse(response);

      recommendations.push({
        categoryId: cat.id,
        categoryName: cat.name,
        currentBudget: currentBudgets[cat.id] || 0,
        recommendedBudget: data.recommended_budget || avgSpending,
        spendHistory: history,
        confidence: variance > 0.3 ? 'low' : variance > 0.1 ? 'medium' : 'high',
        rationale: data.rationale,
      });
    } catch (err) {
      // Fallback to average if AI fails
      recommendations.push({
        categoryId: cat.id,
        categoryName: cat.name,
        currentBudget: currentBudgets[cat.id] || 0,
        recommendedBudget: avgSpending * 1.2, // 20% buffer
        spendHistory: history,
        confidence: 'medium',
        rationale: 'Automated recommendation based on average spending with 20% buffer.',
      });
    }
  }

  return recommendations;
}
