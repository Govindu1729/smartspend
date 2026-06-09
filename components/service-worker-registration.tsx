'use client';
import { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ServiceWorkerRegistration() {
  const [status, setStatus] = useState<'idle' | 'installing' | 'installed' | 'error'>('idle');
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Get user ID
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        if (data.user?.id) {
          setUserId(data.user.id);
          checkNotificationStatus();
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getUser();

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      setStatus('installing');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', registration);
      setStatus('installed');

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('Service Worker updated');
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setStatus('error');
    }
  };

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) return;
    const permission = Notification.permission;
    setIsNotificationEnabled(permission === 'granted');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setIsNotificationEnabled(true);
        await subscribeToNotifications();
        showToast('✅ Notifications enabled!', 'You will receive budget alerts');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToNotifications = async () => {
    if (!userId) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const showToast = (title: string, message: string) => {
    const toastElement = document.createElement('div');
    toastElement.className =
      'fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg z-50';
    toastElement.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="font-semibold text-sm">${title}</p>
          <p class="text-xs text-muted-foreground mt-1">${message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(toastElement);
    setTimeout(() => toastElement.remove(), 4000);
  };

  if (!showBanner || status !== 'installed') return null;

  return (
    <>
      {!isNotificationEnabled && (
        <Card className="sticky top-4 z-40 border-blue-500 bg-blue-50 dark:bg-blue-950 mx-4">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    Get Budget Alerts
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Enable notifications for budget alerts and spending insights
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                >
                  <Bell className="h-3 w-3 mr-1" /> Enable
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowBanner(false)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isNotificationEnabled && (
        <Card className="sticky top-4 z-40 border-green-500 bg-green-50 dark:bg-green-950 mx-4 mt-2">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ Notifications enabled - You'll get budget alerts!
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowBanner(false)}>
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
