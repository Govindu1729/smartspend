'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, TrendingUp, BarChart3, Smartphone, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            SmartSpend
          </h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Smart Money Management for College Students
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Track expenses, set budgets, and get AI-powered insights to master your finances.
            Built for UPI transactions, mess bills, and student life.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why SmartSpend?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Smart Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              Log transactions in seconds. Auto-categorize expenses with AI. Support for UPI, cash, and recurring payments.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Visual Insights</CardTitle>
            </CardHeader>
            <CardContent>
              Beautiful charts and reports. See where your money goes with category breakdowns and monthly trends.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-12 w-12 text-primary mb-4" />
              <CardTitle>PWA Ready</CardTitle>
            </CardHeader>
            <CardContent>
              Install on your phone like a native app. Works offline. Get push notifications for budget alerts.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              Ask natural language questions like "How much did I spend on food?" Get instant AI-generated answers.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <PiggyBank className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Budget Goals</CardTitle>
            </CardHeader>
            <CardContent>
              Set monthly budgets per category. Visual progress bars show your spending. Get alerts before you overspend.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>100% Free</CardTitle>
            </CardHeader>
            <CardContent>
              No subscriptions, no hidden fees. Open source and built for students. Your data stays private and secure.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-primary/5">
          <CardContent className="py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Take Control of Your Finances?</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are already saving smarter with SmartSpend.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-12">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        © 2024 SmartSpend. Built with ❤️ for college students.
      </footer>
    </div>
  );
}
