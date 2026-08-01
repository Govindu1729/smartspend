'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBudgets } from '@/hooks/use-budgets';
import { useBudgetAlerts } from '@/hooks/use-budget-alerts';
import { useCategories } from '@/hooks/use-categories';
import { BudgetPlanner } from '@/components/budget-planner';
import { BudgetAlertBanner } from '@/components/budget-alert-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, RefreshCw, PiggyBank } from 'lucide-react';

export default function BudgetsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUser(user);
    });
  }, [router, supabase]);

  const { budgets, loading, addBudget } = useBudgets(user?.id || '');
  const { alerts, loading: alertsLoading, refresh: refreshAlerts } = useBudgetAlerts(user?.id || '');
  const { categories } = useCategories(user?.id || '');

  if (!user) return null;

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const currentBudgets = budgets.filter((b) => b.month === currentMonth);
  const visibleAlerts = alerts.filter((a) => a.percentage >= 80 && !dismissedAlerts.has(a.categoryId));

  const handleDismissAlert = (categoryId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, categoryId]));
  };

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Planner</h1>
          <p className="text-muted-foreground mt-1">Track your spending limits and stay on target.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAlerts} disabled={alertsLoading} className="glass-card border-border/50">
            <RefreshCw className={`mr-2 h-4 w-4 ${alertsLoading ? 'animate-spin' : ''}`} />
            Check Alerts
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient">
                <Plus className="mr-2 h-4 w-4" /> Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Set Monthly Budget</DialogTitle>
              </DialogHeader>
              <BudgetPlanner
                userId={user.id}
                categories={categories}
                onSubmit={async (data) => {
                  await addBudget(data);
                  setIsAddOpen(false);
                  refreshAlerts();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {visibleAlerts.length > 0 && (
        <BudgetAlertBanner alerts={visibleAlerts} onDismiss={handleDismissAlert} />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const budget = currentBudgets.find((b) => b.category_id === category.id);
          const spent = budget?.spent || 0;
          const percentage = budget ? (spent / budget.amount) * 100 : 0;
          const isOverBudget = percentage >= 100;
          const isWarning = percentage >= 80 && percentage < 100;
          
          // Dynamic colors for progress bar
          const barColor = isOverBudget ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
          const textColor = isOverBudget ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

          return (
            <Card key={category.id} className={`glass-card flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${isOverBudget ? 'border-rose-500/50' : isWarning ? 'border-amber-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  {category.name}
                  {isOverBudget && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {budget ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-2xl font-bold ${textColor}`}>
                        ₹{spent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / ₹{budget.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }} 
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {isOverBudget
                        ? `🚨 Exceeded by ₹${(spent - budget.amount).toLocaleString('en-IN')}`
                        : isWarning
                        ? `⚠️ ${Math.round(percentage)}% spent - Approaching limit!`
                        : `✓ ${Math.round(percentage)}% spent`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No budget set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}