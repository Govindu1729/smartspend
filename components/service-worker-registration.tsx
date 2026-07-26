'use client';
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ServiceWorkerRegistration() {
  const [status, setStatus] = useState<'idle' | 'installed' | 'error'>('idle');
  const [showBanner, setShowBanner] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(() => setStatus('installed'))
        .catch((error) => { console.error('SW registration failed:', error); setStatus('error'); });
    }

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
  }, []);

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) return;
    
    const permission = Notification.permission;
    // Only show if permission is default AND we haven't asked this session
    if (permission === 'default') {
      const shownThisSession = sessionStorage.getItem('notifPromptShown');
      if (!shownThisSession) {
        setShowBanner(true);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToNotifications();
      }
      setShowBanner(false); // Hide after interaction
      sessionStorage.setItem('notifPromptShown', 'true');
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
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem('notifPromptShown', 'true');
  };

  if (!showBanner || status !== 'installed') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <Card className="shadow-xl border-blue-500/50 bg-blue-50 dark:bg-blue-950 backdrop-blur-lg">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Get Budget Alerts</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Enable notifications to receive alerts when you overspend.</p>
                <Button variant="default" size="sm" onClick={requestNotificationPermission} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                  Enable Notifications
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={dismissBanner} className="text-blue-600 hover:text-blue-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}