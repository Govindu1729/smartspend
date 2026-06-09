import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSummary } from '@/components/dashboard-summary';
import { TransactionList } from '@/components/transaction-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current month budgets for quick overview
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .gte('month', new Date().toISOString().slice(0, 7) + '-01')
    .lte('month', new Date().toISOString().slice(0, 7) + '-28');

  const budgetCount = budgets?.length || 0;

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-muted-foreground">Here's your financial overview at a glance</p>
      </div>

      {/* Dashboard Summary */}
      <div className="mb-8">
        <DashboardSummary userId={user.id} />
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Link href="/transactions">
          <Card className="hover:bg-secondary/80 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Track and manage all your transactions</p>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                View All <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/budgets">
          <Card className="hover:bg-secondary/80 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Budgets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{budgetCount} active {budgetCount === 1 ? 'budget' : 'budgets'} this month</p>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Manage <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:bg-secondary/80 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Analyze spending patterns and trends</p>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                View <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="recent" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budget Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Latest Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList userId={user.id} limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="mt-4">
          <BudgetOverview userId={user.id} budgets={budgets} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

async function BudgetOverview({ userId, budgets }: { userId: string; budgets: any[] }) {
  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">No budgets set for this month</p>
          <Link href="/budgets">
            <Button>Set Your First Budget</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budgets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="p-4 rounded-lg border bg-card">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{budget.category || 'Category'}</h3>
                <span className="text-sm text-muted-foreground">₹{budget.spent || 0} / ₹{budget.amount}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    (budget.spent || 0) / budget.amount > 0.8 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((budget.spent || 0) / budget.amount * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/budgets" className="mt-6 block">
          <Button className="w-full">Manage Budgets</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
