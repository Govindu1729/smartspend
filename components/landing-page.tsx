'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, TrendingUp, BarChart3, Smartphone, Zap, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-violet-500/20 dark:bg-violet-500/10 blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-24">
        <nav className="flex justify-between items-center mb-24">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-primary" />
            <span className="gradient-text">SmartSpend</span>
          </h1>
          <div className="flex gap-4">
            <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
            <Link href="/signup"><Button className="btn-gradient">Get Started</Button></Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            Powered by AI
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="gradient-text">Smart Money</span>
            <br />
            Management for Students
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track expenses, set budgets, and get AI-powered insights to master your finances. Built for UPI transactions, mess bills, and student life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="btn-gradient text-lg px-8 h-12">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold tracking-tight mb-4">Everything you need to save smarter</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A complete financial toolkit designed specifically for the modern college student.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: TrendingUp, title: "Smart Tracking", desc: "Log transactions in seconds. Auto-categorize expenses with AI. Support for UPI, cash, and recurring payments." },
            { icon: BarChart3, title: "Visual Insights", desc: "Beautiful charts and reports. See where your money goes with category breakdowns and monthly trends." },
            { icon: Smartphone, title: "PWA Ready", desc: "Install on your phone like a native app. Works offline. Get push notifications for budget alerts." },
            { icon: Zap, title: "AI-Powered", desc: "Ask natural language questions like \"How much did I spend on food?\" Get instant AI-generated answers." },
            { icon: PiggyBank, title: "Budget Goals", desc: "Set monthly budgets per category. Visual progress bars show your spending. Get alerts before you overspend." },
            { icon: Shield, title: "100% Free", desc: "No subscriptions, no hidden fees. Open source and built for students. Your data stays private and secure." }
          ].map((feature, i) => (
            <Card key={i} className="glass-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {feature.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Card className="max-w-3xl mx-auto glass-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5"></div>
          <CardContent className="py-16 relative z-10">
            <h3 className="text-4xl font-bold mb-4 tracking-tight">Ready to take control?</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of students who are already saving smarter with SmartSpend.
            </p>
            <Link href="/signup">
              <Button size="lg" className="btn-gradient text-lg px-12 h-12">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="container mx-auto px-4 py-12 text-center text-sm text-muted-foreground border-t border-border/40">
        © 2024 SmartSpend. Built with ❤️ for college students.
      </footer>
    </div>
  );
}