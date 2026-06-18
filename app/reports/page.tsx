'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { format, subMonths, parse } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface ReportData {
  monthlyBreakdown: Array<{ month: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
}

interface AuthUser {
  id: string;
  email?: string;
}

export default function ReportsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [period, setPeriod] = useState('6months');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData>({
    monthlyBreakdown: [],
    categoryBreakdown: [],
    dailySpending: [],
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user as AuthUser);
      fetchReportData(user.id, period, customStart, customEnd);
    });
  }, [period, customStart, customEnd]);

  const fetchReportData = async (userId: string, selectedPeriod: string, custStart?: string, custEnd?: string) => {
    const endDate = custEnd ? new Date(custEnd) : new Date();
    let startDate = new Date();

    if (selectedPeriod === 'custom') {
      if (!custStart || !custEnd) return;
      startDate = new Date(custStart);
    } else {
      switch (selectedPeriod) {
        case '1month': startDate = subMonths(endDate, 1); break;
        case '3months': startDate = subMonths(endDate, 3); break;
        case '6months': startDate = subMonths(endDate, 6); break;
        case '1year': startDate = subMonths(endDate, 12); break;
      }
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const response = await fetch(`/api/transactions?start=${startStr}&end=${endStr}`, { cache: 'no-store' });
    if (!response.ok) return;
    const transactions: Array<{
      amount: number; type: 'income' | 'expense'; date: string; categories?: { name: string } | null;
    }> = await response.json();

    // Monthly breakdown - sorted chronologically
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const key = format(new Date(t.date), 'yyyy-MM');
      if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
      const m = monthlyMap.get(key)!;
      m[t.type] += t.amount;
    });

    const monthlyArr = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(new Date(key + '-01'), "MMM ''yy"),
        income: val.income,
        expense: val.expense,
      }));

    // Category breakdown - sorted by value
    const categoryMap = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach((t) => {
      const cat = t.categories?.name || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
    });
    const categoryArr = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    // Daily spending - sorted chronologically
    const dailyMap = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach((t) => {
      const key = format(new Date(t.date), 'yyyy-MM-dd');
      dailyMap.set(key, (dailyMap.get(key) || 0) + t.amount);
    });
    const dailyArr = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        date: format(new Date(key + 'T00:00:00'), 'MMM dd'),
        amount: val,
      }));

    setReportData({
      monthlyBreakdown: monthlyArr,
      categoryBreakdown: categoryArr,
      dailySpending: dailyArr,
    });
  };

  if (!user) return null;

  const totalExpense = reportData.categoryBreakdown.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for pie chart
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px] border-2" aria-label="Select period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="from-date" className="text-xs">From</Label>
                <Input id="from-date" type="date" value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[150px] border-2" max={customEnd || undefined} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to-date" className="text-xs">To</Label>
                <Input id="to-date" type="date" value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[150px] border-2" min={customStart || undefined} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Income vs Expenses Bar Chart */}
            <Card>
              <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
              <CardContent className="h-96">
                {reportData.monthlyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyBreakdown} margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={60}
                        style={{ fontSize: '11px' }} interval={0} />
                      <YAxis style={{ fontSize: '11px' }}
                        tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                      <Bar dataKey="income" fill="#22c55e" name="Income" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Expense Distribution Pie Chart with Legend */}
            <Card>
              <CardHeader><CardTitle>Expense Distribution</CardTitle></CardHeader>
              <CardContent className="h-96">
                {reportData.categoryBreakdown.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center h-full gap-2">
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie data={reportData.categoryBreakdown} cx="50%" cy="50%"
                          outerRadius={90} dataKey="value"
                          label={renderPieLabel} labelLine={false}>
                          {reportData.categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1 text-xs overflow-y-auto max-h-full">
                      {reportData.categoryBreakdown.map((cat, index) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="whitespace-nowrap">{cat.name}: ₹{cat.value.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {category.name}
                      </span>
                      <span className="text-muted-foreground">
                        ₹{category.value.toLocaleString()} ({totalExpense > 0 ? ((category.value / totalExpense) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${totalExpense > 0 ? (category.value / totalExpense) * 100 : 0}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }} />
                    </div>
                  </div>
                ))}
                {reportData.categoryBreakdown.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No expense data for this period.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader><CardTitle>Daily Spending Trend</CardTitle></CardHeader>
            <CardContent className="h-96">
              {reportData.dailySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.dailySpending} margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={60}
                      style={{ fontSize: '11px' }} interval={Math.max(0, Math.floor(reportData.dailySpending.length / 10))} />
                    <YAxis style={{ fontSize: '11px' }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2}
                      name="Daily Spending" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
