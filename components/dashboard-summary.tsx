'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardSummary({ userId }: { userId: string }) {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, savingsRate: 0, monthlyTrend: [] });

  useEffect(() => {
    fetch(`/api/transactions/summary?user_id=${userId}`)
      .then(res => res.json())
      .then(setStats);
  }, [userId]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
        <CardContent><div className="text-2xl font-bold">₹{stats.totalIncome.toLocaleString()}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
        <CardContent><div className="text-2xl font-bold">₹{stats.totalExpense.toLocaleString()}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Savings Rate</CardTitle><PiggyBank className="h-4 w-4 text-blue-500" /></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.savingsRate}%</div></CardContent>
      </Card>
      <Card className="md:col-span-3">
        <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyTrend}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
