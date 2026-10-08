'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, TrendingUp, BarChart3, Smartphone, Zap, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">AI-Powered </span>
            <span className="gradient-text">Personal Finance</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Track spending, set budgets, get AI-powered insights, and receive real-time alerts
            when you're about to overspend. Built for modern money management.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button className="btn-gradient px-6">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="stat-card">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Tracking</h3>
              <p className="text-body">Automatically categorize transactions and track your spending patterns with intelligent insights.</p>
            </div>
            
            <div className="stat-card">
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 w-fit">
                <PiggyBank className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Budget Control</h3>
              <p className="text-body">Set monthly budgets and receive alerts before you overspend. Stay on top of your finances.</p>
            </div>
            
            <div className="stat-card">
              <div className="mb-4 p-3 rounded-lg bg-violet-500/10 w-fit">
                <Zap className="h-6 w-6 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
              <p className="text-body">Ask questions in plain English and get personalized financial recommendations powered by AI.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
