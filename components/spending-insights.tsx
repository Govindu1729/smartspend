import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Anomaly {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

interface SpendingInsightsProps {
  userId: string;
}

export function SpendingInsights({ userId }: SpendingInsightsProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnomalies();
    fetchForecast();
    fetchRecommendations();
  }, [userId]);

  const fetchAnomalies = async () => {
    try {
      const res = await fetch(`/api/anomalies`);
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    }
  };

  const fetchForecast = async () => {
    try {
      const res = await fetch(`/api/spending-forecast`);
      if (res.ok) {
        const data = await res.json();
        setForecast(data.forecasts || []);
      }
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`/api/budget-recommendations`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900';
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900';
      default: return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spending Forecast */}
      {forecast.length > 0 && (
        <Card className="stat-card card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>📊</span> Monthly Spending Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecast.map((f) => (
                <div key={f.categoryId} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{f.categoryName}</p>
                      <p className="text-xs text-muted-foreground">
                        Current: ₹{f.currentSpend.toLocaleString('en-IN')} / 
                        Projected: ₹{f.projectedSpend.toFixed(0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      f.pace === 'behind' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      f.pace === 'ahead' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {f.pace === 'behind' ? '⚠️ Over budget' : 
                       f.pace === 'ahead' ? '✅ Under budget' : '✓ On track'}
                    </span>
                  </div>
                  {f.alertAt && f.alertAt > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      🔴 Alert: You're expected to exceed budget in {Math.ceil(f.alertAt)} days
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Recommendations */}
      {recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💡 AI-Powered Budget Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.categoryId} className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{rec.categoryName}</p>
                      <p className="text-xs text-muted-foreground">
                        Current: ₹{rec.currentBudget.toLocaleString('en-IN')} → 
                        <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                          Recommended: ₹{rec.recommendedBudget.toFixed(0).toLocaleString('en-IN')}
                        </span>
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.confidence === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      rec.confidence === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {rec.confidence === 'high' ? '✓ High confidence' : 
                       rec.confidence === 'medium' ? '• Medium confidence' : '○ Low confidence'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card className="glass-card border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Spending Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{anomaly.description}</p>
                      <p className="text-xs opacity-75">
                        ₹{anomaly.amount.toLocaleString('en-IN')} • {anomaly.category} • {anomaly.date}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/5 text-white">
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs mt-2 opacity-90">{anomaly.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {anomalies.length === 0 && forecast.length === 0 && recommendations.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No insights available yet. Add more transactions to see personalized recommendations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
