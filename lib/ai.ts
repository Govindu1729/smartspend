// Groq AI Integration for SmartSpend - FREE & FAST
import Groq from 'groq-sdk';

// Get API key from environment
const apiKey = process.env.GROQ_API_KEY;

// Debug logging (remove in production)
if (!apiKey) {
  console.error('⚠️ GROQ_API_KEY is not set in environment variables');
} else {
  console.log('✅ Groq API key found, length:', apiKey.length);
}

// Initialize Groq client with API key
const groq = new Groq({ 
  apiKey: apiKey || 'dummy-key-for-initialization'
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

/**
 * Call Groq AI API with financial context
 */
async function callGroqAI(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  // Add system prompt for financial expertise
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  } else {
    messages.push({ 
      role: 'system', 
      content: `You are SmartSpend AI, an expert personal finance assistant for students and young professionals in India. 
      
Your role:
- Analyze spending patterns and provide actionable insights
- Answer questions about transactions, budgets, and savings
- Use ₹ (rupee symbol) for all currency amounts
- Be friendly, encouraging, and non-judgmental
- Provide specific, data-driven recommendations
- Keep responses concise (2-4 sentences) unless asked for details
- Format numbers with commas (e.g., ₹1,50,000)
- Highlight concerning patterns gently
- Celebrate good financial habits

Always base your answers on the provided transaction and budget data.`
    });
  }
  
  messages.push({ role: 'user', content: prompt });
  
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });
    
    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Groq AI error:', error);
    throw error;
  }
}

export async function categorizeTransaction(
  description: string,
  categoriesCsv: string
): Promise<string | null> {
  try {
    const prompt = `Classify this expense into one category: ${categoriesCsv}. Reply with only the category name.\nDescription: ${description}`;
    return (await callGroqAI(prompt)).trim() || null;
  } catch (error) {
    console.error('AI categorization error:', error);
    return null;
  }
}

export async function answerFinancialQuery(
  query: string,
  context: { transactions: unknown; budgets: unknown }
): Promise<string> {
  try {
    const prompt = `You are a helpful personal finance assistant. Answer based on this data:\n${JSON.stringify(context)}\n\nUser question: ${query}\n\nBe concise and friendly. Use ₹ for rupee amounts.`;
    return await callGroqAI(prompt);
  } catch (error) {
    console.error('AI query error:', error);
    return `AI Error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}

export async function generateMonthlySummary(
  transactions: unknown[],
  budgets: unknown[]
): Promise<string> {
  try {
    const prompt = `Generate a friendly monthly financial summary:\nTransactions: ${JSON.stringify(transactions)}\nBudgets: ${JSON.stringify(budgets)}\n\nInclude: total income, expenses, savings rate, top spending, and one money-saving tip. Use ₹.`;
    return await callGroqAI(prompt);
  } catch (error) {
    console.error('AI summary error:', error);
    return 'Unable to generate summary.';
  }
}

/**
 * Generate spending insights from transaction data
 */
export async function generateSpendingInsights(
  transactions: Array<{
    amount: number;
    type: string;
    category?: string;
    date: string;
    description?: string;
  }>,
  budgets?: Array<{ category: string; amount: number; spent: number }>
): Promise<string> {
  const recentTransactions = transactions.slice(0, 50);
  
  const prompt = `Analyze these recent transactions and provide 3-5 key insights:\n\n${JSON.stringify(recentTransactions, null, 2)}\n\n${budgets ? `\nBudget status:\n${JSON.stringify(budgets, null, 2)}` : ''}\n\nProvide insights on:\n1. Total spending trends\n2. Top spending categories\n3. Any unusual patterns\n4. Budget compliance (if budget data provided)\n5. One actionable money-saving tip\n\nBe specific with amounts in ₹.`;

  return await callGroqAI(prompt);
}

/**
 * Detect anomalous spending patterns
 */
export async function detectSpendingAnomalies(
  transactions: Array<{
    amount: number;
    category?: string;
    date: string;
  }>
): Promise<Array<{
  type: 'unusual_amount' | 'category_spike' | 'frequency_change';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}>> {
  const prompt = `Analyze these transactions for anomalies (unusual spending patterns):\n\n${JSON.stringify(transactions.slice(0, 100), null, 2)}\n\nLook for:\n1. Unusually large amounts compared to category average\n2. Sudden spikes in specific categories\n3. Changes in spending frequency\n\nReturn JSON array of anomalies found (max 3) with format:\n[{\n  "type": "unusual_amount|category_spike|frequency_change",\n  "description": "Brief description",\n  "severity": "low|medium|high",\n  "suggestion": "Actionable suggestion"\n}]\n\nIf no anomalies found, return empty array.`;

  try {
    const response = await callGroqAI(prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return [];
  }
}

/**
 * Calculate financial health score (0-100)
 */
export async function calculateFinancialHealthScore(
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    budgetCompliance: number;
    emergencyFundMonths?: number;
  }
): Promise<{
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  improvements: string[];
}> {
  const prompt = `Calculate a financial health score (0-100) based on:\n\nIncome: ₹${metrics.totalIncome.toLocaleString('en-IN')}\nExpenses: ₹${metrics.totalExpenses.toLocaleString('en-IN')}\nSavings Rate: ${metrics.savingsRate}%\nBudget Compliance: ${metrics.budgetCompliance}%\n${metrics.emergencyFundMonths ? `Emergency Fund: ${metrics.emergencyFundMonths} months` : ''}\n\nReturn JSON with:\n{\n  "score": number (0-100),\n  "grade": "A|B|C|D|F",\n  "strengths": ["array of 2-3 positive observations"],\n  "improvements": ["array of 2-3 actionable suggestions"]\n}`;

  try {
    const response = await callGroqAI(prompt);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback calculation
    const score = Math.round(
      (metrics.savingsRate * 0.4) + 
      (metrics.budgetCompliance * 0.4) + 
      (metrics.emergencyFundMonths ? Math.min(metrics.emergencyFundMonths * 10, 20) : 0)
    );
    
    return {
      score: Math.min(score, 100),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      strengths: ['Regular income tracking', 'Active budget management'],
      improvements: ['Increase savings rate', 'Build emergency fund']
    };
  } catch (error) {
    console.error('Health score calculation error:', error);
    return {
      score: 50,
      grade: 'C',
      strengths: ['Getting started with financial tracking'],
      improvements: ['Set up budgets', 'Track expenses consistently']
    };
  }
}

export default {
  categorizeTransaction,
  answerFinancialQuery,
  generateMonthlySummary,
  generateSpendingInsights,
  detectSpendingAnomalies,
  calculateFinancialHealthScore
};
