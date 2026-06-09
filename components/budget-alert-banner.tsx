'use client';
import { Alert, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BudgetAlertData } from '@/hooks/use-budget-alerts';

interface BudgetAlertBannerProps {
  alerts: BudgetAlertData[];
  onDismiss?: (categoryId: string) => void;
}

export function BudgetAlertBanner({ alerts, onDismiss }: BudgetAlertBannerProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => {
        const isExceeded = alert.percentage >= 100;
        const isCritical = alert.percentage >= 90;

        return (
          <Card
            key={alert.categoryId}
            className={
              isExceeded
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : isCritical
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isExceeded
                        ? 'text-red-600 dark:text-red-400'
                        : isCritical
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-semibold text-sm ${
                        isExceeded
                          ? 'text-red-900 dark:text-red-100'
                          : isCritical
                          ? 'text-orange-900 dark:text-orange-100'
                          : 'text-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      {isExceeded
                        ? `🚨 Budget Exceeded: ${alert.categoryName}`
                        : `⚠️ Budget Alert: ${alert.categoryName}`}
                    </h4>
                    <p
                      className={`text-xs mt-2 ${
                        isExceeded
                          ? 'text-red-700 dark:text-red-300'
                          : isCritical
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}
                    >
                      You've spent ₹{alert.currentSpend.toLocaleString('en-IN')} out of ₹
                      {alert.budgetAmount.toLocaleString('en-IN')} ({alert.percentage}%) on {alert.categoryName}.
                    </p>
                  </div>
                </div>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(alert.categoryId)}
                    className="flex-shrink-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
