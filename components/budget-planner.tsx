'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: initialData?.category_id || '',
      amount: initialData?.amount || 0,
      month: initialData?.month || new Date().toISOString().slice(0, 7) + '-01',
      alert_threshold: initialData?.alert_threshold || 0.8,
    },
  });

  const alertThreshold = watch('alert_threshold');

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Category */}
      <div>
        <Label htmlFor="category" className="font-semibold mb-2 block">Select Category</Label>
        <Select
          defaultValue={initialData?.category_id || ''}
          onValueChange={(value) => setValue('category_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a category..." />
          </SelectTrigger>
          <SelectContent>
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>No categories available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id.message?.toString()}</p>}
      </div>

      {/* Monthly Budget Amount */}
      <div>
        <Label htmlFor="amount" className="font-semibold mb-2 block">Monthly Budget (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="100"
          min="0"
          {...register('amount', { valueAsNumber: true })}
          placeholder="e.g., 5000"
          className="text-lg"
        />
        {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message?.toString()}</p>}
        <p className="text-xs text-muted-foreground mt-1">Set how much you plan to spend on this category each month</p>
      </div>

      {/* Month */}
      <div>
        <Label htmlFor="month" className="font-semibold mb-2 block">Month</Label>
        <Input id="month" type="month" {...register('month')} />
        <p className="text-xs text-muted-foreground mt-1">Select the month for this budget</p>
      </div>

      {/* Alert Threshold */}
      <div>
        <Label htmlFor="alert_threshold" className="font-semibold mb-2 block">
          Alert Threshold: {Math.round(alertThreshold * 100)}%
        </Label>
        <Input
          id="alert_threshold"
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          {...register('alert_threshold', { valueAsNumber: true })}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>50% - Alert Early</span>
          <span>100% - Alert at Limit</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          You'll get notified when your spending reaches {Math.round(alertThreshold * 100)}% of your budget
        </p>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full mt-6" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          initialData ? 'Update Budget' : 'Set Budget'
        )}
      </Button>
    </form>
  );
}
