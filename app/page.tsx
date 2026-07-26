import { createClient } from '@/lib/supabase/server';
import { DashboardSummary } from '@/components/dashboard-summary';
import { TransactionList } from '@/components/transaction-list';
import { LandingPage } from '@/components/landing-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Greeting } from '@/components/greeting';
import Link from 'next/link';
import { ArrowRight, TrendingUp, PiggyBank, BarChart3, Plus, AlertCircle } from 'lucide-react';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0];

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthStart = currentMonth + '-01';
  const monthEnd = currentMonth + '-31';
  
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(name, icon)')
    .eq('user_id', user.id)
    .gte('month', monthStart)
    .lte('month', monthEnd);

  const categoryIds = (budgets || []).map((b) => b.category_id);

  let spendByCategory: Record<string, number> = {};
  if (categoryIds.length > 0) {
    const { data: txData } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .in('category_id', categoryIds)
      .eq('type', 'expense')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    (txData || []).forEach((t) => {
      spendByCategory[t.category_id] = (spendByCategory[t.category_id] || 0) + t.amount;
    });
  }

  const budgetData = (budgets || []).map((budget) => ({
    ...budget,
    spent: spendByCategory[budget.category_id] || 0,
  }));

  const budgetCount = budgetData.length;

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <Greeting name={displayName} />
        </h1>
      </div>

      <div className="mb-8">
        <DashboardSummary userId={user.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Link href="/transactions">
          <Card className="glass-card hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Track and manage all your transactions</p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary px-0">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/budgets">
          <Card className="glass-card hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Budgets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {budgetCount > 0 
                  ? `${budgetCount} active ${budgetCount === 1 ? 'budget' : 'budgets'} this month`
                  : 'Set budgets to control spending'}
              </p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary px-0">
                {budgetCount > 0 ? 'Manage' : 'Get Started'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="glass-card hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Analyze spending patterns and trends</p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary px-0">
                View <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionList userId={user.id} limit={5} />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Monthly Budgets</CardTitle>
            <Link href="/budgets">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {budgetData.length > 0 ? (
              <div className="space-y-4">
                {budgetData.map((budget) => {
                  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  const isWarning = percentage > 80 && percentage <= 100;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate">
                          {budget.categories?.name || 'Category'}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOverBudget && <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-medium ${
                            isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'
                          }`}>
                            ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <PiggyBank className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">No budgets set for this month</p>
                <Link href="/budgets">
                  <Button size="sm" variant="outline" className="btn-gradient border-none">
                    <Plus className="h-4 w-4 mr-2" /> Set Your First Budget
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}