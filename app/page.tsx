import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSummary } from '@/components/dashboard-summary';
import { TransactionList } from '@/components/transaction-list';
import { LandingPage } from '@/components/landing-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, TrendingUp, PiggyBank, BarChart3, Plus, AlertCircle } from 'lucide-react';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  // Fetch current month budgets with category names
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(name, icon)')
    .eq('user_id', user.id)
    .gte('month', currentMonth + '-01')
    .lte('month', currentMonth + '-31');

  // Fetch spending for each budget category this month
  const budgetData = await Promise.all(
    (budgets || []).map(async (budget) => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', budget.category_id)
        .eq('type', 'expense')
        .gte('date', currentMonth + '-01')
        .lte('date', currentMonth + '-31');
      
      const spent = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      return { ...budget, spent };
    })
  );

  const budgetCount = budgetData.length;
  const hasData = budgetCount > 0;

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-muted-foreground">Here&apos;s your financial overview at a glance</p>
      </div>

      {/* Dashboard Summary */}
      <div className="mb-8">
        <DashboardSummary userId={user.id} />
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link href="/transactions">
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Track and manage all your transactions</p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary">
                View All <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/budgets">
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <PiggyBank className="h-5 w-5 text-blue-600" />
                </div>
                Budgets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {budgetCount > 0 
                  ? `${budgetCount} active ${budgetCount === 1 ? 'budget' : 'budgets'} this month`
                  : 'Set budgets to control spending'}
              </p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary">
                {budgetCount > 0 ? 'Manage' : 'Get Started'} <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full group">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Analyze spending patterns and trends</p>
              <Button variant="ghost" size="sm" className="w-full justify-start group-hover:text-primary">
                View <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionList userId={user.id} limit={5} />
          </CardContent>
        </Card>

        {/* Budget Overview - Takes 1 column */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Monthly Budgets</CardTitle>
            <Link href="/budgets">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {budgetData.length > 0 ? (
              <div className="space-y-3">
                {budgetData.map((budget) => {
                  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  const isWarning = percentage > 80 && percentage <= 100;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm truncate">
                            {budget.categories?.name || 'Category'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOverBudget && <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-medium ${
                            isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'
                          }`}>
                            ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      {isOverBudget && (
                        <p className="text-xs text-red-500">Over budget by ₹{(budget.spent - budget.amount).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No budgets set for this month</p>
                <Link href="/budgets">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Set Your First Budget
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
