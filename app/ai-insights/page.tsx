'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AIPanel } from '@/components/ai-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export default function AIInsightsPage() {
  const [user, setUser] = useState<any>(null);
  const [monthlySummary, setMonthlySummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else {
        setUser(user);
        generateMonthlySummary(user.id);
      }
    });
  }, []);

  const generateMonthlySummary = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          query: 'Generate a detailed monthly financial summary for this month, including total income, total expenses, savings rate, top spending categories, and any concerning patterns or suggestions for improvement.',
        }),
      });
      const data = await response.json();
      setMonthlySummary(data.answer);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          AI Insights
        </h1>
        <Button onClick={() => generateMonthlySummary(user.id)} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Refresh Summary
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Monthly Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{monthlySummary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <AIPanel userId={user.id} />
      </div>
    </main>
  );
}
