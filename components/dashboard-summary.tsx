'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function DashboardSummary({ userId }: { userId: string }) {
  const [stats, setStats] = useState<{
    totalIncome: number; totalExpense: number; savingsRate: number;
    monthlyTrend: Array<{ month: string; income: number; expense: number }>;
    topCategories: Array<{ name: string; value: number }>;
  }>({ totalIncome: 0, totalExpense: 0, savingsRate: 0, monthlyTrend: [], topCategories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions/summary`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-secondary rounded-lg"></div>)}
      </div>
    );
  }

  const savingsRate = stats.savingsRate || 0;
  const isNegative = savingsRate < 0;
  const isLow = savingsRate >= 0 && savingsRate < 20;
  const isGood = savingsRate >= 20;

  return (
    <div className="grid gap-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalIncome.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.totalExpense.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className={`border-t-4 ${isNegative ? 'border-t-red-500' : isLow ? 'border-t-yellow-500' : 'border-t-green-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            {isNegative ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
             isLow ? <PiggyBank className="h-5 w-5 text-yellow-500" /> :
             <PiggyBank className="h-5 w-5 text-green-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isNegative ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
              {savingsRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isNegative ? '⚠️ Expenses exceeded income' :
               isLow ? '💡 Try to save more' :
               '✅ Healthy savings!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            {stats.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} style={{ fontSize: '11px' }} interval={0} />
                  <YAxis style={{ fontSize: '11px' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Add transactions to see trends</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Spending Categories</CardTitle></CardHeader>
          <CardContent className="h-64">
            {stats.topCategories?.length > 0 ? (
              <div className="space-y-3">
                {stats.topCategories.map((category: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm font-semibold">₹{category.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(category.value / (stats.topCategories[0]?.value || 1)) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No expense data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
