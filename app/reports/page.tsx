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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

interface ReportData {
  monthlyBreakdown: Array<{ month: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
  incomeVsExpense: Array<{ month: string; income: number; expense: number }>;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
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
    incomeVsExpense: [],
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user as AuthUser);
      fetchReportData(user.id, period, customStart, customEnd);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd]);

  const fetchReportData = async (
    userId: string,
    selectedPeriod: string,
    custStart?: string,
    custEnd?: string
  ) => {
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

    const response = await fetch(
      `/api/transactions?start=${startStr}&end=${endStr}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return;
    const transactions: Array<{
      amount: number;
      type: 'income' | 'expense';
      date: string;
      categories?: { name: string } | null;
    }> = await response.json();

    // Process monthly breakdown
    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0 };
      monthlyData[month][t.type] += t.amount;
    });

    // Process category breakdown
    const categoryData: Record<string, { name: string; value: number }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.categories?.name || 'Uncategorized';
        if (!categoryData[cat]) categoryData[cat] = { name: cat, value: 0 };
        categoryData[cat].value += t.amount;
      });

    // Process daily spending
    const dailyData: Record<string, { date: string; amount: number }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = format(new Date(t.date), 'MMM dd');
        if (!dailyData[day]) dailyData[day] = { date: day, amount: 0 };
        dailyData[day].amount += t.amount;
      });

    const monthSort = (a: { month: string }, b: { month: string }) =>
      new Date(a.month).getTime() - new Date(b.month).getTime();
    const daySort = (a: { date: string }, b: { date: string }) =>
      new Date(a.date).getTime() - new Date(b.date).getTime();

    const monthlyArr = Object.values(monthlyData).sort(monthSort);
    setReportData({
      monthlyBreakdown: monthlyArr,
      categoryBreakdown: Object.values(categoryData).sort((a, b) => b.value - a.value),
      dailySpending: Object.values(dailyData).sort(daySort),
      incomeVsExpense: monthlyArr,
    });
  };

  if (!user) return null;

  const totalExpense = reportData.categoryBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold">Reports &amp; Analytics</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Select period">
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
                <Input
                  id="from-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-[150px]"
                  max={customEnd || undefined}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to-date" className="text-xs">To</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-[150px]"
                  min={customStart || undefined}
                />
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
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        ₹{category.value.toLocaleString()} ({totalExpense > 0 ? ((category.value / totalExpense) * 100).toFixed(1) : '0'}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${totalExpense > 0 ? (category.value / totalExpense) * 100 : 0}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
                {reportData.categoryBreakdown.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No expense data for this period.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Daily Spending" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
