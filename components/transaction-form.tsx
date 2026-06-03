'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/use-categories';
import { Loader2, Sparkles } from 'lucide-react';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().optional(),
  description: z.string().optional(),
  date: z.string(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

interface TransactionFormProps {
  userId: string;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function TransactionForm({ userId, initialData, onSubmit }: TransactionFormProps) {
  const { categories } = useCategories(userId);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      type: initialData?.type || 'expense',
      category_id: initialData?.category_id || '',
      description: initialData?.description || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      is_recurring: initialData?.is_recurring || false,
      recurring_interval: initialData?.recurring_interval || 'monthly',
    },
  });

  const isRecurring = watch('is_recurring');

  const handleAutoCategorize = async () => {
    if (!description) return;
    setIsCategorizing(true);
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, userId }),
      });
      const data = await response.json();
      if (data.category_id) {
        setValue('category_id', data.category_id);
      }
    } catch (error) {
      console.error('Auto-categorization failed:', error);
    }
    setIsCategorizing(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="type">Transaction Type</Label>
        <Select
          defaultValue={initialData?.type || 'expense'}
          onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          placeholder="0.00"
        />
        {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message?.toString()}</p>}
      </div>

      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="description">Description</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAutoCategorize}
            disabled={!description || isCategorizing}
          >
            {isCategorizing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Auto-categorize
          </Button>
        </div>
        <Input
          id="description"
          {...register('description')}
          placeholder="e.g., Lunch at mess"
          onChange={(e) => {
            setDescription(e.target.value);
            register('description').onChange(e);
          }}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          defaultValue={initialData?.category_id || ''}
          onValueChange={(value) => setValue('category_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register('date')} />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setValue('is_recurring', checked)}
        />
        <Label htmlFor="is_recurring">Recurring Transaction</Label>
      </div>

      {isRecurring && (
        <div>
          <Label htmlFor="recurring_interval">Recurring Interval</Label>
          <Select
            defaultValue={initialData?.recurring_interval || 'monthly'}
            onValueChange={(value: any) => setValue('recurring_interval', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Add'} Transaction
      </Button>
    </form>
  );
}
