'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBudgets } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { BudgetPlanner } from '@/components/budget-planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function BudgetsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUser(user);
    });
  }, []);

  const { budgets, loading, addBudget, updateBudget, deleteBudget, checkAlerts } = useBudgets(user?.id || '');
  const { categories } = useCategories(user?.id || '');

  if (!user) return null;

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const currentBudgets = budgets.filter((b) => b.month === currentMonth);

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Budget Planner</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
            </DialogHeader>
            <BudgetPlanner
              userId={user.id}
              categories={categories}
              onSubmit={async (data) => {
                await addBudget(data);
                setIsAddOpen(false);
                toast({ title: 'Budget set successfully' });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => {
          const budget = currentBudgets.find((b) => b.category_id === category.id);
          const spent = budget?.spent || 0;
          const percentage = budget ? (spent / budget.amount) * 100 : 0;
          const isOverBudget = percentage >= 80;

          return (
            <Card key={category.id} className={isOverBudget ? 'border-red-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  {category.name}
                  {isOverBudget && <AlertTriangle className="h-5 w-5 text-red-500" />}
                </CardTitle>
                {budget && (
                  <span className="text-sm text-muted-foreground">
                    ₹{spent.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {budget ? (
                  <>
                    <Progress value={Math.min(percentage, 100)} className={percentage >= 100 ? 'bg-red-200' : ''} />
                    <p className="text-sm mt-2 text-muted-foreground">
                      {percentage >= 100
                        ? 'Budget exceeded!'
                        : percentage >= 80
                        ? `${Math.round(percentage)}% spent - Approaching limit!`
                        : `${Math.round(percentage)}% spent`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No budget set for this month</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
