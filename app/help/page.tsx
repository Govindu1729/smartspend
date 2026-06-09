'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  Zap,
  TrendingUp,
  PiggyBank,
  Bell,
  Smartphone,
  Search,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'How do I add a transaction?',
    answer:
      'Go to the Transactions page and click the "Add Transaction" button. Fill in the amount, description, and category. You can also use AI auto-categorization by describing the transaction.',
  },
  {
    question: 'What is the AI auto-categorize feature?',
    answer:
      'The AI auto-categorize feature uses Google Gemini to suggest the best category for your transaction based on its description. This saves time and helps keep your transactions organized.',
  },
  {
    question: 'How do budget alerts work?',
    answer:
      'You can set monthly budgets for each spending category. SmartSpend will alert you when you reach 80% of your budget and again if you exceed 100%. You can enable/disable these notifications in settings.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes! You can export all your transactions as CSV from the Settings page. This is useful for backup or analysis in spreadsheet applications.',
  },
  {
    question: 'Is SmartSpend available offline?',
    answer:
      'SmartSpend is a Progressive Web App (PWA), which means you can install it on your device and use basic features offline. Your data will sync when you go back online.',
  },
  {
    question: 'How do I set up push notifications?',
    answer:
      'When you first visit SmartSpend, you\'ll be prompted to enable push notifications. You can also manage this in your Settings. Push notifications will alert you about budget alerts and other important updates.',
  },
  {
    question: 'Can I change my currency?',
    answer:
      'Yes! You can change your preferred currency in Settings. SmartSpend supports USD, EUR, GBP, INR, AUD, CAD, and JPY.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'SmartSpend uses Supabase for secure data storage with enterprise-grade encryption. Your login credentials are protected with industry-standard authentication.',
  },
];

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Transaction Tracking',
    description: 'Log expenses effortlessly with automatic categorization powered by AI.',
  },
  {
    icon: PiggyBank,
    title: 'Budget Planning',
    description: 'Set monthly budgets by category and get real-time alerts when approaching limits.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Receive budget alerts and spending insights via web push notifications.',
  },
  {
    icon: Zap,
    title: 'AI Insights',
    description: 'Ask natural language questions about your spending patterns and get instant insights.',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Reports',
    description: 'Visualize your spending with charts and analyze trends over time.',
  },
  {
    icon: Smartphone,
    title: 'Installable App',
    description: 'Install SmartSpend as a native app on your device with offline support.',
  },
];

const tips = [
  {
    title: 'Consistent Categorization',
    description: 'Use consistent category names to make it easier to track spending patterns.',
  },
  {
    title: 'Regular Budget Review',
    description: 'Review your budgets monthly and adjust them based on your spending habits.',
  },
  {
    title: 'Use AI Insights',
    description: 'Ask questions like "How much did I spend on food last month?" to get quick insights.',
  },
  {
    title: 'Set Realistic Budgets',
    description: 'Base your budgets on historical spending data for more accurate tracking.',
  },
  {
    title: 'Export Regularly',
    description: 'Export your data monthly as a backup and for deeper analysis in spreadsheets.',
  },
  {
    title: 'Enable Notifications',
    description: 'Keep notifications enabled to catch budget alerts before they become problematic.',
  },
];

export default function HelpPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    checkAuth();
  }, []);

  if (!user) return null;

  return (
    <main className="container mx-auto p-4 max-w-4xl pb-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <HelpCircle className="h-9 w-9" />
          Help & Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Learn how to get the most out of SmartSpend
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-3">
          {faqItems.map((item, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold pr-4">
                    {item.question}
                  </CardTitle>
                  <ChevronRight
                    className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${
                      expandedFAQ === index ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </CardHeader>
              {expandedFAQ === index && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pro Tips */}
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                💡 <strong>Use AI Insights daily:</strong> Ask questions like "What's my
                biggest spending category?" or "How much did I save this month?"
              </p>
              <p>
                📊 <strong>Review reports weekly:</strong> Check the Reports page to spot
                spending trends early.
              </p>
              <p>
                🎯 <strong>Set goals and track:</strong> Create budgets for each category
                and challenge yourself to stay within them.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support Section */}
      <Card className="mt-12 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3">Need More Help?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              📧 Email us at{' '}
              <a href="mailto:support@smartspend.app" className="text-primary hover:underline">
                support@smartspend.app
              </a>
            </p>
            <p>
              🐛 Report issues on{' '}
              <a
                href="https://github.com/Govindu1729/smartspend"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p>
              📱 Check out our mobile app features by installing SmartSpend as an app
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
