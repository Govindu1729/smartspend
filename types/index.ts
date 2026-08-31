export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  description?: string;
  date: string; // YYYY-MM-DD
  is_recurring: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  last_recurred_at?: string | null;
  created_at?: string;
  categories?: { name: string; icon: string };
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color?: string;
  is_default: boolean;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string; // first day of month
  amount: number;
  alert_threshold: number;
  categories?: { name: string; icon: string };
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  created_at?: string;
};

export type GoalContribution = {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  comment?: string;
  created_at?: string;
};
