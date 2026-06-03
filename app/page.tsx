import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSummary } from '@/components/dashboard-summary';
import { TransactionList } from '@/components/transaction-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetPlanner } from '@/components/budget-planner';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">SmartSpend</h1>
      <DashboardSummary userId={user.id} />
      <Tabs defaultValue="recent" className="mt-6">
        <TabsList>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budget Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <TransactionList userId={user.id} limit={5} />
        </TabsContent>
        <TabsContent value="budgets">
          <BudgetOverview userId={user.id} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function BudgetOverview({ userId }: { userId: string }) {
  // This would be a client component that fetches budgets
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Budget Overview</h2>
      <p>Budget component would go here</p>
    </div>
  );
}
