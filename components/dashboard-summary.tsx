'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-card animate-pulse rounded-xl"></div>)}
      </div>
    );
  }

  const savingsRate = stats.savingsRate || 0;
  const isNegative = savingsRate < 0;
  const isLow = savingsRate >= 0 && savingsRate < 20;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-t-4 border-t-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{stats.totalIncome.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-t-4 border-t-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30">
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">₹{stats.totalExpense.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card className={`glass-card border-t-4 ${isNegative ? 'border-t-rose-500' : isLow ? 'border-t-amber-500' : 'border-t-emerald-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
            <div className={`p-2 rounded-full ${
              isNegative ? 'bg-rose-100 dark:bg-rose-900/30' : 
              isLow ? 'bg-amber-100 dark:bg-amber-900/30' : 
              'bg-emerald-100 dark:bg-emerald-900/30'
            }`}>
              {isNegative ? <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> :
               isLow ? <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" /> :
               <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              isNegative ? 'text-rose-600 dark:text-rose-400' : 
              isLow ? 'text-amber-600 dark:text-amber-400' : 
              'text-emerald-600 dark:text-emerald-400'
            }`}>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base font-medium">Monthly Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            {stats.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  {/* FIX: Used CSS variables for dark mode compatibility */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} style={{ fontSize: '11px' }} interval={0} stroke="hsl(var(--muted-foreground))" />
                  <YAxis style={{ fontSize: '11px' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--popover-foreground))' }} formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                  <Bar dataKey="income" fill="#6366f1" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#f43f5e" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Add transactions to see trends</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base font-medium">Top Spending Categories</CardTitle></CardHeader>
          <CardContent className="h-64">
            {stats.topCategories?.length > 0 ? (
              <div className="space-y-4 pt-2">
                {stats.topCategories.map((category: any, index: number) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="font-semibold text-muted-foreground">₹{category.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
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
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No expense data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}