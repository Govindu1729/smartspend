import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function categorizeTransaction(description: string, categories: string[]): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Classify this expense description into one of these categories: ${categories.join(', ')}. Only reply with the exact category name.\nDescription: ${description}\nCategory:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categoryName = response.text().trim();
    
    return categoryName;
  } catch (error) {
    console.error('AI categorization error:', error);
    return null;
  }
}

export async function answerFinancialQuery(query: string, context: any): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a helpful personal finance assistant for an Indian college student. Answer based on this data:\n${JSON.stringify(context)}\n\nUser question: ${query}\n\nProvide a concise, friendly response. Include rupee amounts where relevant. Give practical advice if appropriate.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('AI query error:', error);
    return "I'm sorry, I couldn't process that query. Please try again.";
  }
}

export async function generateMonthlySummary(transactions: any[], budgets: any[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a friendly monthly financial summary for an Indian college student based on this data:\nTransactions: ${JSON.stringify(transactions)}\nBudgets: ${JSON.stringify(budgets)}\n\nInclude: total income, total expenses, savings rate, top spending categories, budget adherence, and one practical money-saving tip. Keep it conversational and encouraging.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('AI summary error:', error);
    return "Unable to generate summary at this time.";
  }
}
