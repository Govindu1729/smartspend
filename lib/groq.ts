import Groq from 'groq-sdk';

// Initialize Groq client
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Fallback to Google Generative AI if Groq is not available
let googleAI: any = null;
if (!groq && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  import('@google/generative-ai').then(({ GoogleGenerativeAI }) => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
    googleAI = genAI.getGenerativeModel({ model: 'gemini-pro' });
  });
}

/**
 * Chat with AI using Groq (primary) or Google Gemini (fallback)
 * Optimized for financial conversations
 */
export async function chatWithFinancialAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<string> {
  const { temperature = 0.7, maxTokens = 1024, stream = false } = options || {};

  // Add system prompt for financial expertise
  const systemPrompt = {
    role: 'system' as const,
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

Always base your answers on the provided transaction and budget data. If you don't have enough information, ask clarifying questions.`
  };

  const allMessages = [systemPrompt, ...messages];

  try {
    // Try Groq first (fastest & free)
    if (groq) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: allMessages,
        temperature,
        max_tokens: maxTokens,
        stream: false, // Disable streaming for simpler handling
      });
      return response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
    }

    // Fallback to Google Gemini
    if (googleAI) {
      const result = await googleAI.generateContent({
        contents: [{ role: 'user', parts: [{ text: messages[messages.length - 1]?.content }] }],
      });
      const response = await result.response;
      return response.text() || 'I apologize, but I couldn\'t generate a response.';
    }

    throw new Error('No AI provider configured');
  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error instanceof Error && error.message.includes('rate')) {
      return '🤖 I\'m experiencing high traffic right now. Please try again in a minute!';
    }
    
    return '😕 I encountered an error. Please check your connection and try again.';
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
  
  const prompt = `Analyze these recent transactions and provide 3-5 key insights:

${JSON.stringify(recentTransactions, null, 2)}

${budgets ? `\nBudget status:\n${JSON.stringify(budgets, null, 2)}` : ''}

Provide insights on:
1. Total spending trends
2. Top spending categories
3. Any unusual patterns
4. Budget compliance (if budget data provided)
5. One actionable money-saving tip

Be specific with amounts in ₹.`;

  return await chatWithFinancialAI([
    { role: 'user', content: prompt }
  ], { maxTokens: 512 });
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
  const prompt = `Analyze these transactions for anomalies (unusual spending patterns):

${JSON.stringify(transactions.slice(0, 100), null, 2)}

Look for:
1. Unusually large amounts compared to category average
2. Sudden spikes in specific categories
3. Changes in spending frequency

Return JSON array of anomalies found (max 3) with format:
[{
  "type": "unusual_amount|category_spike|frequency_change",
  "description": "Brief description",
  "severity": "low|medium|high",
  "suggestion": "Actionable suggestion"
}]

If no anomalies found, return empty array.`;

  try {
    const response = await chatWithFinancialAI([
      { role: 'user', content: prompt }
    ], { maxTokens: 512 });
    
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
  const prompt = `Calculate a financial health score (0-100) based on:

Income: ₹${metrics.totalIncome.toLocaleString('en-IN')}
Expenses: ₹${metrics.totalExpenses.toLocaleString('en-IN')}
Savings Rate: ${metrics.savingsRate}%
Budget Compliance: ${metrics.budgetCompliance}%
${metrics.emergencyFundMonths ? `Emergency Fund: ${metrics.emergencyFundMonths} months` : ''}

Return JSON with:
{
  "score": number (0-100),
  "grade": "A|B|C|D|F",
  "strengths": ["array of 2-3 positive observations"],
  "improvements": ["array of 2-3 actionable suggestions"]
}`;

  try {
    const response = await chatWithFinancialAI([
      { role: 'user', content: prompt }
    ], { maxTokens: 512 });
    
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
  chatWithFinancialAI,
  generateSpendingInsights,
  detectSpendingAnomalies,
  calculateFinancialHealthScore
};
