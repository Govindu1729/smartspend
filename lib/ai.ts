import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-flash';

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env.local.');
  }
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

/**
 * Ask Gemini to classify an expense description into one of the user's
 * existing categories. Returns the category name (string), or null on failure.
 */
export async function categorizeTransaction(
  description: string,
  categoriesCsv: string
): Promise<string | null> {
  try {
    const model = getGenAI().getGenerativeModel({ model: AI_MODEL });
    const prompt = `Classify this expense description into one of these categories: ${categoriesCsv}. Only reply with the exact category name.\nDescription: ${description}\nCategory:`;

    const result = await model.generateContent(prompt);
    const categoryName = result.response.text().trim();

    return categoryName || null;
  } catch (error) {
    console.error('AI categorization error:', error);
    return null;
  }
}

/**
 * Answer a natural-language question about the user's finances using the
 * provided transaction + budget context.
 */
export async function answerFinancialQuery(
  query: string,
  context: { transactions: unknown; budgets: unknown }
): Promise<string> {
  try {
    const model = getGenAI().getGenerativeModel({ model: AI_MODEL });
    const prompt = `You are a helpful personal finance assistant. Answer based on this data:\n${JSON.stringify(
      context
    )}\n\nUser question: ${query}\n\nProvide a concise, friendly response. Include rupee amounts where relevant. Give practical advice if appropriate.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI query error:', error);
    return "I'm sorry, I couldn't process that query. Please try again.";
  }
}

/**
 * Generate a friendly monthly financial summary from raw transactions & budgets.
 */
export async function generateMonthlySummary(
  transactions: unknown[],
  budgets: unknown[]
): Promise<string> {
  try {
    const model = getGenAI().getGenerativeModel({ model: AI_MODEL });
    const prompt = `Generate a friendly monthly financial summary based on this data:\nTransactions: ${JSON.stringify(
      transactions
    )}\nBudgets: ${JSON.stringify(
      budgets
    )}\n\nInclude: total income, total expenses, savings rate, top spending categories, budget adherence, and one practical money-saving tip. Keep it conversational and encouraging.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI summary error:', error);
    return 'Unable to generate summary at this time.';
  }
}
