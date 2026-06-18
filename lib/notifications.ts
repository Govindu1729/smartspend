import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

let _vapidConfigured = false;

function ensureVapidConfigured() {
  if (_vapidConfigured) return;

  const email = process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!email || !publicKey || !privateKey) {
    throw new Error(
      'Missing VAPID env vars. Set VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY in .env.local.'
    );
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  _vapidConfigured = true;
}

export async function sendPushNotification(
  userId: string,
  notification: NotificationPayload
): Promise<{ sent: number; total: number }> {
  try {
    ensureVapidConfigured();
  } catch (err) {
    console.error('VAPID not configured, skipping push:', err);
    return { sent: 0, total: 0 };
  }

  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, total: 0 };
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: notification.badge || '/icons/icon-192x192.png',
    data: notification.data || {},
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch (error: unknown) {
        // Clean up invalid subscriptions
        if (
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          (error.statusCode === 410 || error.statusCode === 404)
        ) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        throw error;
      }
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  return { sent: successful, total: subscriptions.length };
}

/**
 * Cron-style helper: scan all users for budget breaches and notify them.
 * Uses the SQL `check_budget_alerts()` function defined in the migration.
 * Safe to call from a Vercel Cron route or scheduled job.
 */
export async function checkAndNotifyAllBudgetAlerts() {
  const { getSupabaseAdmin } = await import('@/lib/supabase/server');
  const admin = getSupabaseAdmin();
  const { data: alerts } = await admin.rpc('check_budget_alerts');

  if (!alerts || alerts.length === 0) return [];

  for (const alert of alerts as Array<{
    user_id: string;
    category: string;
    spent: number;
    budget: number;
    percent: number;
  }>) {
    await sendPushNotification(alert.user_id, {
      title: 'Budget Alert',
      body: `You've spent ${alert.percent}% of your ${alert.category} budget (INR ${alert.spent}/INR ${alert.budget})`,
    });
  }

  return alerts;
}
