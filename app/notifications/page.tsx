'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'budget_alert' | 'budget_exceeded' | 'info' | 'system';
  title: string;
  body: string | null;
  category_name: string | null;
  percentage: number | null;
  amount: number | null;
  is_read: boolean;
  created_at: string;
}

const ICONS: Record<Notification['type'], typeof Bell> = {
  budget_alert: AlertTriangle,
  budget_exceeded: AlertCircle,
  info: Info,
  system: Bell,
};

const COLORS: Record<Notification['type'], string> = {
  budget_alert: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  budget_exceeded: 'text-red-600 bg-red-50 dark:bg-red-950',
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  system: 'text-slate-600 bg-slate-50 dark:bg-slate-950',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'budget_alert' | 'budget_exceeded'>('all');
  const [search, setSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.set('unread', 'true');
      params.set('limit', '100');
      const res = await fetch(`/api/notifications?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id }),
    });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
  };

  const deleteNotification = async (id: string) => {
    const prev = notifications;
    setNotifications((curr) => curr.filter((n) => n.id !== id));
    const target = prev.find((n) => n.id === id);
    if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  };

  const clearAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    setNotifications([]);
    setUnreadCount(0);
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_all' }),
    });
  };

  // Apply client-side filters (search + type filter, since API only handles 'unread')
  const filtered = notifications.filter((n) => {
    if (filter !== 'all' && filter !== 'unread' && n.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.body?.toLowerCase().includes(q) ?? false) ||
        (n.category_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" aria-hidden="true" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Budget alerts and important updates about your finances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" aria-hidden="true" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search notifications"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All notifications</SelectItem>
            <SelectItem value="unread">Unread only</SelectItem>
            <SelectItem value="budget_alert">Budget alerts</SelectItem>
            <SelectItem value="budget_exceeded">Budget exceeded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-20" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search || filter !== 'all'
                ? 'No notifications match your filters. Try clearing them.'
                : "You're all caught up! Budget alerts will appear here when you cross your thresholds."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" role="list" aria-live="polite">
          {filtered.map((notification) => {
            const Icon = ICONS[notification.type] ?? Bell;
            const colorClass = COLORS[notification.type] ?? COLORS.system;
            return (
              <Card
                key={notification.id}
                role="listitem"
                className={
                  notification.is_read
                    ? 'opacity-70'
                    : 'border-l-4 border-l-primary'
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                            {!notification.is_read && (
                              <span className="inline-block h-2 w-2 rounded-full bg-primary ml-2 align-middle" aria-label="Unread" />
                            )}
                          </h4>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.body}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markRead(notification.id)}
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
