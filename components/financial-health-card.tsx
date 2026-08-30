'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { scaleInBounce, fadeInUp, staggerContainer } from '@/lib/animations';

interface FinancialHealthCardProps {
  userId: string;
}

interface HealthMetrics {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  budgetCompliance: number;
  emergencyFundMonths?: number;
}

interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  improvements: string[];
}

export function FinancialHealthCard({ userId }: FinancialHealthCardProps) {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthScore | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);

  useEffect(() => {
    fetchFinancialHealth();
  }, [userId]);

  const fetchFinancialHealth = async () => {
    setLoading(true);
    try {
      // Fetch user's financial data
      const response = await fetch(`/api/transactions/summary?userId=${userId}`);
      const data = await response.json();
      
      // Calculate metrics (in production, this would be more sophisticated)
      const calculatedMetrics: HealthMetrics = {
        totalIncome: data.totalIncome || 0,
        totalExpenses: data.totalExpenses || 0,
        savingsRate: data.savingsRate || 0,
        budgetCompliance: data.budgetCompliance || 75,
        emergencyFundMonths: data.emergencyFundMonths,
      };
      
      setMetrics(calculatedMetrics);

      // Call AI to calculate health score
      const healthResponse = await fetch('/api/ai/health-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, metrics: calculatedMetrics }),
      });
      
      const healthResult = await healthResponse.json();
      setHealthData(healthResult);
    } catch (error) {
      console.error('Error fetching financial health:', error);
      // Fallback data
      setHealthData({
        score: 65,
        grade: 'C',
        strengths: ['Regular expense tracking', 'Active budget management'],
        improvements: ['Increase savings rate', 'Build emergency fund']
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500 text-white';
      case 'B': return 'bg-green-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-orange-500 text-white';
      case 'F': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-secondary/50 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-secondary/50 rounded animate-pulse" />
              <div className="h-4 bg-secondary/50 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <Card className="border-2 border-primary/20 overflow-hidden relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Financial Health Score
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchFinancialHealth}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Score Display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${
                  healthData?.score && healthData.score >= 80 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : healthData?.score && healthData.score >= 60
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-red-500 bg-red-500/10'
                }`}
              >
                <span className={`text-2xl font-bold ${getScoreColor(healthData?.score || 0)}`}>
                  {healthData?.score || 0}
                </span>
              </motion.div>
              
              <div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <Badge className={`${getGradeColor(healthData?.grade || 'C')} text-lg px-3 py-1`}>
                    Grade: {healthData?.grade || 'C'}
                  </Badge>
                  {healthData?.score && healthData.score >= 70 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </motion.div>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthData?.score && healthData.score >= 80 
                    ? 'Excellent financial health!' 
                    : healthData?.score && healthData.score >= 60
                    ? 'Good progress, room for improvement'
                    : 'Time to focus on your finances'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Metrics Overview */}
          {metrics && (
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <MetricCard
                label="Savings Rate"
                value={`${metrics.savingsRate}%`}
                icon={PiggyBank}
                trend={metrics.savingsRate >= 20 ? 'good' : 'warning'}
              />
              <MetricCard
                label="Budget Compliance"
                value={`${metrics.budgetCompliance}%`}
                icon={CheckCircle2}
                trend={metrics.budgetCompliance >= 80 ? 'good' : 'warning'}
              />
              <MetricCard
                label="Monthly Income"
                value={`₹${(metrics.totalIncome / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                icon={TrendingUp}
                trend="neutral"
              />
              <MetricCard
                label="Monthly Expenses"
                value={`₹${(metrics.totalExpenses / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                icon={TrendingDown}
                trend={metrics.totalExpenses < metrics.totalIncome * 0.8 ? 'good' : 'warning'}
              />
            </motion.div>
          )}

          {/* Strengths */}
          <motion.div variants={fadeInUp} className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {healthData?.strengths.map((strength, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    {strength}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Improvements */}
          <motion.div variants={fadeInUp} className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Areas to Improve
            </h4>
            <div className="flex flex-wrap gap-2">
              {healthData?.improvements.map((improvement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Badge variant="outline" className="border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 cursor-pointer">
                    {improvement}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button className="w-full btn-gradient group">
              Get Personalized Recommendations
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  icon: any;
  trend: 'good' | 'warning' | 'neutral';
}

function MetricCard({ label, value, icon: Icon, trend }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-3 rounded-lg bg-secondary/50 border border-border/50"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3 w-3 ${
          trend === 'good' ? 'text-emerald-500' : 
          trend === 'warning' ? 'text-orange-500' : 
          'text-muted-foreground'
        }`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </motion.div>
  );
}
