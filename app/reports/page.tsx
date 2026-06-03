'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [period, setPeriod] = useState('6months');
  const [reportData, setReportData] = useState<any>({
    monthlyBreakdown: [],
    categoryBreakdown: [],
    dailySpending: [],
    incomeVsExpense: [],
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else {
        setUser(user);
        fetchReportData(user.id, period);
      }
    });
  }, [period]);

  const fetchReportData = async (userId: string, selectedPeriod: string) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case '1month':
        startDate = subMonths(endDate, 1);
        break;
      case '3months':
        startDate = subMonths(endDate, 3);
        break;
      case '6months':
        startDate = subMonths(endDate, 6);
        break;
      case '1year':
        startDate = subMonths(endDate, 12);
        break;
    }

    const response = await fetch(
      `/api/transactions?user_id=${userId}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    const transactions = await response.json();

    // Process monthly breakdown
    const monthlyData: any = {};
    transactions.forEach((t: any) => {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      monthlyData[month][t.type] += t.amount;
    });

    // Process category breakdown
    const categoryData: any = {};
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        const cat = t.categories?.name || 'Uncategorized';
        if (!categoryData[cat]) {
          categoryData[cat] = { name: cat, value: 0 };
        }
        categoryData[cat].value += t.amount;
      });

    // Process daily spending
    const dailyData: any = {};
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        const day = format(new Date(t.date), 'MMM dd');
        if (!dailyData[day]) {
          dailyData[day] = { date: day, amount: 0 };
        }
        dailyData[day].amount += t.amount;
      });

    setReportData({
      monthlyBreakdown: Object.values(monthlyData).sort(
        (a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime()
      ),
      categoryBreakdown: Object.values(categoryData).sort((a: any, b: any) => b.value - a.value),
      dailySpending: Object.values(dailyData).sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      incomeVsExpense: Object.values(monthlyData).sort(
        (a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime()
      ),
    });
  };

  if (!user) return null;

  const totalExpense = reportData.categoryBreakdown.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
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
                      {reportData.categoryBreakdown.map((entry: any, index: number) => (
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
                {reportData.categoryBreakdown.map((category: any, index: number) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        ₹{category.value.toLocaleString()} ({((category.value / totalExpense) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(category.value / totalExpense) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
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
