'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Filter,
  RefreshCw,
  Clock,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  category?: string;
  budget_percentage?: number;
  created_at: string;
  read: boolean;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        await loadNotifications(user.id);
      }
    };
    loadUser();
  }, []);

  const loadNotifications = async (userId: string) => {
    setLoading(true);
    try {
      // In a real implementation, you'd fetch from a notifications table
      // For now, we'll create mock notifications from budget alerts and transactions
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Budget Alert - Food',
          message: 'You\'ve spent 85% of your $500 Food budget this month',
          category: 'Food',
          budget_percentage: 85,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: '2',
          type: 'alert',
          title: 'Budget Exceeded - Entertainment',
          message: 'You\'ve exceeded your $200 Entertainment budget by $45',
          category: 'Entertainment',
          budget_percentage: 122,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: '3',
          type: 'success',
          title: 'Savings Goal Met - Transport',
          message: 'Great job! You\'ve stayed under budget for Transport this month',
          category: 'Transport',
          budget_percentage: 65,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: false,
        },
        {
          id: '4',
          type: 'info',
          title: 'New Transaction Auto-Categorized',
          message: 'Your coffee purchase was automatically categorized as Food & Dining',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: '5',
          type: 'warning',
          title: 'Unusual Spending Pattern',
          message: 'Your shopping expenses are 40% higher than last month',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
      ];

      setNotifications(mockNotifications);
      applyFilters(mockNotifications, 'all', '');
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (items: Notification[], type: string, search: string) => {
    let filtered = items;

    if (type !== 'all') {
      filtered = filtered.filter(n => n.type === type);
    }

    if (search) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredNotifications(filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    applyFilters(notifications, type, searchTerm);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(notifications, filterType, term);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    applyFilters(notifications.filter(n => n.id !== id), filterType, searchTerm);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      setFilteredNotifications([]);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'alert':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'success':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <main className="container mx-auto p-4 max-w-4xl pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notifications
        </h1>
        <p className="text-muted-foreground">Stay updated with budget alerts and spending insights</p>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterType} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadNotifications(user.id)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {filteredNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total Notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{notifications.filter(n => n.type === 'warning' || n.type === 'alert').length}</p>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading notifications...
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications to display</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Try adjusting your search' : 'You\'re all caught up!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${notification.read ? '' : 'bg-primary/5 border-primary/20'}`}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {notification.title}
                      </h3>
                      <Badge variant={getTypeBadgeVariant(notification.type)} className="flex-shrink-0">
                        {notification.type}
                      </Badge>
                      {!notification.read && (
                        <Badge className="flex-shrink-0 bg-blue-500">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      {notification.category && (
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground">
                          {notification.category}
                        </span>
                      )}
                      {notification.budget_percentage && (
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground">
                          {notification.budget_percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                        title="Mark as read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="h-8 w-8 p-0 hover:text-destructive"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
