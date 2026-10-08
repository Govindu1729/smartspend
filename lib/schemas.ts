import { z } from 'zod';

// Currency types
export const currencySchema = z.enum(['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED', 'SAR']);
export const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED', 'SAR'] as const;

// Transaction type
export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
  currency: currencySchema.optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive().max(1_000_000_000).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
  currency: currencySchema.optional(),
});

// Budget schema
export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'month must be YYYY-MM-DD'),
  amount: z.coerce.number().positive().max(1_000_000_000),
  alert_threshold: z.coerce.number().min(0.1).max(1).optional(),
});

export const updateBudgetSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive().max(1_000_000_000).optional(),
  alert_threshold: z.coerce.number().min(0.1).max(1).optional(),
});

// Email subscription schema
export const emailSubscriptionSchema = z.object({
  email: z.string().email(),
  frequency: z.enum(['weekly', 'monthly']),
  categories: z.array(z.string()).optional(),
});
