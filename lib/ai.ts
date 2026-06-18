const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API key not set');
  return apiKey;
}

async function callAI(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://smartspend-sandy.vercel.app',
      'X-Title': 'SmartSpend',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`Status ${response.status}: ${text.substring(0, 150)}`);
  }
  
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content || 'No response';
}

export async function categorizeTransaction(
  description: string,
  categoriesCsv: string
): Promise<string | null> {
  try {
    const prompt = `Classify this expense into one category: ${categoriesCsv}. Reply with only the category name.\nDescription: ${description}`;
    return (await callAI(prompt)).trim() || null;
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
    return await callAI(prompt);
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
    return await callAI(prompt);
  } catch (error) {
    console.error('AI summary error:', error);
    return 'Unable to generate summary.';
  }
}
