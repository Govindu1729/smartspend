/**
 * Notification Preferences Hook
 * 
 * Manages user notification settings for in-app, email, and push notifications
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotificationSettings {
  budget_alerts: boolean;
  budget_exceeded: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
  unusual_activity: boolean;
  bill_reminders: boolean;
  savings_goals: boolean;
  category_spending_limits: boolean;
  transaction_confirmations: boolean;
  price_drop_alerts: boolean;
}

export interface EmailPreferences {
  marketing_emails: boolean;
  product_updates: boolean;
  security_alerts: boolean;
  weekly_digest: boolean;
  monthly_report: boolean;
}

export interface PushPreferences {
  enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string;   // "08:00"
  timezone: string;          // "Asia/Kolkata"
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  budget_alerts: true,
  budget_exceeded: true,
  weekly_summary: false,
  monthly_report: true,
  unusual_activity: true,
  bill_reminders: true,
  savings_goals: true,
  category_spending_limits: false,
  transaction_confirmations: false,
  price_drop_alerts: false,
};

const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  marketing_emails: false,
  product_updates: true,
  security_alerts: true,
  weekly_digest: false,
  monthly_report: true,
};

const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: 'Asia/Kolkata',
};

export function useNotificationPreferences() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>(DEFAULT_EMAIL_PREFERENCES);
  const [pushPreferences, setPushPreferences] = useState<PushPreferences>(DEFAULT_PUSH_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (cancelled) return;
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_settings, email_preferences, push_preferences')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.notification_settings) {
            setNotificationSettings({
              ...DEFAULT_NOTIFICATION_SETTINGS,
              ...(profile.notification_settings as NotificationSettings),
            });
          }
          
          if (profile.email_preferences) {
            setEmailPreferences({
              ...DEFAULT_EMAIL_PREFERENCES,
              ...(profile.email_preferences as EmailPreferences),
            });
          }
          
          if (profile.push_preferences) {
            setPushPreferences({
              ...DEFAULT_PUSH_PREFERENCES,
              ...(profile.push_preferences as PushPreferences),
            });
          }
        }
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    
    return () => { cancelled = true; };
  }, []);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const updatedSettings = { ...notificationSettings, ...settings };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ notification_settings: updatedSettings })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setNotificationSettings(updatedSettings);
      return { success: true };
    } catch (err) {
      console.error('Error updating notification settings:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update settings',
      };
    }
  }, [notificationSettings]);

  /**
   * Update email preferences
   */
  const updateEmailPreferences = useCallback(async (preferences: Partial<EmailPreferences>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const updatedPreferences = { ...emailPreferences, ...preferences };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email_preferences: updatedPreferences })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setEmailPreferences(updatedPreferences);
      return { success: true };
    } catch (err) {
      console.error('Error updating email preferences:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update preferences',
      };
    }
  }, [emailPreferences]);

  /**
   * Update push notification preferences
   */
  const updatePushPreferences = useCallback(async (preferences: Partial<PushPreferences>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const updatedPreferences = { ...pushPreferences, ...preferences };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ push_preferences: updatedPreferences })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPushPreferences(updatedPreferences);
      return { success: true };
    } catch (err) {
      console.error('Error updating push preferences:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update preferences',
      };
    }
  }, [pushPreferences]);

  /**
   * Check if currently in quiet hours
   */
  const isQuietHours = useCallback((): boolean => {
    if (!pushPreferences.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = pushPreferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = pushPreferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, [pushPreferences]);

  /**
   * Reset all preferences to defaults
   */
  const resetToDefaults = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notification_settings: DEFAULT_NOTIFICATION_SETTINGS,
          email_preferences: DEFAULT_EMAIL_PREFERENCES,
          push_preferences: DEFAULT_PUSH_PREFERENCES,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      setEmailPreferences(DEFAULT_EMAIL_PREFERENCES);
      setPushPreferences(DEFAULT_PUSH_PREFERENCES);
      
      return { success: true };
    } catch (err) {
      console.error('Error resetting preferences:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reset preferences',
      };
    }
  }, []);

  return {
    notificationSettings,
    emailPreferences,
    pushPreferences,
    loading,
    error,
    updateNotificationSettings,
    updateEmailPreferences,
    updatePushPreferences,
    resetToDefaults,
    isQuietHours,
  };
}

/**
 * Quick toggle hook for single notification setting
 */
export function useNotificationToggle(setting: keyof NotificationSettings) {
  const { notificationSettings, updateNotificationSettings } = useNotificationPreferences();

  const toggle = useCallback(async () => {
    const result = await updateNotificationSettings({
      [setting]: !notificationSettings[setting],
    });
    return result;
  }, [setting, notificationSettings, updateNotificationSettings]);

  return {
    enabled: notificationSettings[setting],
    toggle,
  };
}
