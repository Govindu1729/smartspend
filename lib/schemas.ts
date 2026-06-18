import { z } from 'zod';

// ---- Reusable primitives ----
export const uuidSchema = z.string().uuid();
export const amountSchema = z.number().positive().max(1_000_000_000);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

// ---- Transactions ----
export const transactionTypeSchema = z.enum(['income', 'expense']);
export const recurringIntervalSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const createTransactionSchema = z.object({
  amount: amountSchema,
  type: transactionTypeSchema,
  category_id: uuidSchema.optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  date: dateSchema.optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: recurringIntervalSchema.optional().nullable(),
});

export const updateTransactionSchema = z.object({
  id: uuidSchema,
  amount: amountSchema.optional(),
  type: transactionTypeSchema.optional(),
  category_id: uuidSchema.optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  date: dateSchema.optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: recurringIntervalSchema.optional().nullable(),
});

export const transactionQuerySchema = z.object({
  start: dateSchema.optional(),
  end: dateSchema.optional(),
  type: z.enum(['income', 'expense', 'all']).optional(),
});

// ---- Categories ----
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  icon: z.string().trim().max(50).optional(),
});

export const updateCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(50).optional(),
  icon: z.string().trim().max(50).optional(),
});

// ---- Budgets ----
export const createBudgetSchema = z.object({
  category_id: uuidSchema,
  month: dateSchema,
  amount: amountSchema,
  alert_threshold: z.number().min(0.1).max(1).optional(),
});

export const updateBudgetSchema = z.object({
  id: uuidSchema,
  amount: amountSchema.optional(),
  alert_threshold: z.number().min(0.1).max(1).optional(),
});

// ---- AI ----
export const aiQuerySchema = z.object({
  query: z.string().trim().min(1).max(1000),
});

export const aiCategorizeSchema = z.object({
  description: z.string().trim().min(1).max(500),
});

// ---- Push ----
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const sendPushSchema = z.object({
  message: z.string().trim().min(1).max(500),
  title: z.string().trim().max(100).optional(),
});

// ---- Auth ----
export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(100).optional(),
});
