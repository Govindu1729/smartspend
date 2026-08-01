'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { format, subMonths } from 'date-fns';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-xl border-border/60">
        {label && <p className="label text-sm font-medium mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-xs capitalize" style={{ color: entry.color }}>
            {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ReportData {
  monthlyBreakdown: Array<{ month: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  dailySpending: Array<{ date: string; amount: number }>;
}

const CHART_COLORS_LIGHT = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488', '#ea580c'];
const CHART_COLORS_DARK = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'];

export default function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      fetchReportData(user.id, period, customStart, customEnd);
    });
  }, [period, customStart, customEnd, router, supabase]);

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
    const transactions: any[] = await response.json();

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const key = format(new Date(t.date), 'yyyy-MM');
      if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
      const m = monthlyMap.get(key)!;
      if (t.type === 'income') m.income += t.amount;
      else m.expense += t.amount;
    });

    const monthlyArr = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(new Date(key + '-01'), "MMM ''yy"),
        income: val.income,
        expense: val.expense,
      }));

    const categoryMap = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach((t) => {
      const cat = t.categories?.name || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
    });
    const categoryArr = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

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

    setReportData({ monthlyBreakdown: monthlyArr, categoryBreakdown: categoryArr, dailySpending: dailyArr });
  };

  if (!user) return null;

  const isDark = mounted && resolvedTheme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.2)';
  const CHART_COLORS = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const incomeColor = isDark ? '#34d399' : '#059669';
  const expenseColor = isDark ? '#f87171' : '#dc2626';
  const trendColor = isDark ? '#a78bfa' : '#7c3aed';

  const totalExpense = reportData.categoryBreakdown.reduce((sum, item) => sum + item.value, 0);
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Visualize your financial habits over time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px] glass-card border-border/50" aria-label="Select period">
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
                <Label htmlFor="from-date" className="text-xs text-muted-foreground">From</Label>
                <Input id="from-date" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[140px] glass-card border-border/50" max={customEnd || undefined} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to-date" className="text-xs text-muted-foreground">To</Label>
                <Input id="to-date" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[140px] glass-card border-border/50" min={customStart || undefined} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Income vs Expenses</CardTitle></CardHeader>
              <CardContent className="h-[400px]">
                {reportData.monthlyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyBreakdown} margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} tick={{ fill: axisColor, fontSize: 11 }} interval={0} stroke={axisColor} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} stroke={axisColor} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="income" fill={incomeColor} name="Income" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" fill={expenseColor} name="Expense" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Expense Distribution</CardTitle></CardHeader>
              <CardContent className="h-[400px]">
                {reportData.categoryBreakdown.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center h-full gap-4">
                    <ResponsiveContainer width="100%" height="60%">
                      <PieChart>
                        <Pie data={reportData.categoryBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={renderPieLabel} labelLine={false}>
                          {reportData.categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 text-sm w-full md:w-auto overflow-y-auto max-h-[160px] pr-2">
                      {reportData.categoryBreakdown.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className="whitespace-nowrap">{cat.name}</span>
                          </div>
                          <span className="font-medium">₹{cat.value.toLocaleString('en-IN')}</span>
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
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Spending by Category</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-4">
              {reportData.categoryBreakdown.map((category, index) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      {category.name}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      ₹{category.value.toLocaleString()} 
                      <span className="text-xs ml-1">({totalExpense > 0 ? ((category.value / totalExpense) * 100).toFixed(1) : 0}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${totalExpense > 0 ? (category.value / totalExpense) * 100 : 0}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Daily Spending Trend</CardTitle></CardHeader>
            <CardContent className="h-[450px]">
              {reportData.dailySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.dailySpending} margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fill: axisColor, fontSize: 11 }} interval={Math.max(0, Math.floor(reportData.dailySpending.length / 10))} stroke={axisColor} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => `₹${v}`} stroke={axisColor} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="amount" stroke={trendColor} strokeWidth={3} name="Daily Spending" dot={{ r: 3, fill: trendColor }} activeDot={{ r: 5 }} />
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
