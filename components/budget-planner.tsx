'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  month: z.string(),
  alert_threshold: z.number().min(0.5).max(1).default(0.8),
});

interface BudgetPlannerProps {
  userId: string;
  categories: any[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function BudgetPlanner({ userId, categories, initialData, onSubmit }: BudgetPlannerProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: initialData?.category_id || '',
      amount: initialData?.amount || 0,
      month: initialData?.month || new Date().toISOString().slice(0, 7) + '-01',
      alert_threshold: initialData?.alert_threshold || 0.8,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id.message?.toString()}</p>}
      </div>

      <div>
        <Label htmlFor="amount">Monthly Budget (₹)</Label>
        <Input
          id="amount"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          placeholder="5000"
        />
        {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message?.toString()}</p>}
      </div>

      <div>
        <Label htmlFor="month">Month</Label>
        <Input id="month" type="month" {...register('month')} />
      </div>

      <div>
        <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
        <Input
          id="alert_threshold"
          type="number"
          step="0.05"
          min="0.5"
          max="1"
          {...register('alert_threshold', { valueAsNumber: true })}
          placeholder="0.8 (80%)"
        />
        <p className="text-xs text-muted-foreground mt-1">
          You'll get notified when spending reaches this percentage (e.g., 0.8 = 80%)
        </p>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Set'} Budget
      </Button>
    </form>
  );
}
