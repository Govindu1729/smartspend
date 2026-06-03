import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase/server';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export async function sendPushNotification(userId: string, notification: NotificationPayload) {
  try {
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, message: 'No subscriptions found' };
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
        } catch (error: any) {
          // Clean up invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    return { sent: successful, total: subscriptions.length };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: 0, error: 'Failed to send notifications' };
  }
}

export async function checkBudgetAlerts() {
  try {
    const { data: alerts } = await supabaseAdmin.rpc('check_budget_alerts');

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        await sendPushNotification(alert.user_id, {
          title: '⚠️ Budget Alert',
          body: `You've spent ${alert.percent}% of your ${alert.category} budget (₹${alert.spent}/₹${alert.budget})`,
        });
      }
    }

    return alerts || [];
  } catch (error) {
    console.error('Error checking budget alerts:', error);
    return [];
  }
}
