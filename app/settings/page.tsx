'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Lock, 
  Bell, 
  Download, 
  Trash2, 
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface UserSettings {
  email: string;
  display_name?: string;
  currency: string;
  notifications_enabled: boolean;
  budget_alerts_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    display_name: '',
    currency: 'USD',
    notifications_enabled: true,
    budget_alerts_enabled: true,
    theme: 'system',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        setSettings(prev => ({
          ...prev,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || '',
          theme: (theme as any) || 'system',
        }));
      }
    };
    loadUser();
  }, [theme]);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      setTheme(value); // Apply theme instantly via next-themes
    }
    setSaveMessage('');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    setSaveMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: settings.display_name,
          currency: settings.currency,
          notifications_enabled: settings.notifications_enabled,
          budget_alerts_enabled: settings.budget_alerts_enabled,
          theme: settings.theme,
        }
      });

      if (error) throw error;
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setSaveMessage('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export?format=csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartspend-data-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSaveMessage('Data exported successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Account deletion failed');
      
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <main className="container mx-auto p-4 max-w-2xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {saveMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{saveMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold">{user.email?.[0]?.toUpperCase()}</span>
            </div>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed after signup</p>
          </div>

          <div>
            <Label htmlFor="displayName" className="mb-2 block">Display Name</Label>
            <Input
              id="displayName"
              value={settings.display_name}
              onChange={(e) => handleSettingChange('display_name', e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label htmlFor="currency" className="mb-2 block">Currency</Label>
            <Select value={settings.currency} onValueChange={(value: string) => handleSettingChange('currency', value)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme" className="mb-2 block">Theme</Label>
            <Select 
              value={settings.theme} 
              onValueChange={(value: any) => handleSettingChange('theme', value)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive app notifications</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications_enabled}
              onCheckedChange={(checked: boolean) => handleSettingChange('notifications_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="budgetAlerts" className="text-base font-medium">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when approaching budget limits</p>
            </div>
            <Switch
              id="budgetAlerts"
              checked={settings.budget_alerts_enabled}
              onCheckedChange={(checked: boolean) => handleSettingChange('budget_alerts_enabled', checked)}
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={loading} variant="outline" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="newPassword"
                      type={passwordForm.showNew ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordForm({ ...passwordForm, showNew: !passwordForm.showNew })}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {passwordForm.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={passwordForm.showConfirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordForm({ ...passwordForm, showConfirm: !passwordForm.showConfirm })}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {passwordForm.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Export your financial data for backup or analysis</p>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting} 
            variant="outline" 
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Data as CSV'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will permanently remove all your data. This action cannot be undone.
          </p>

          {showDeleteConfirm ? (
            <div className="space-y-3 p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-950">
              <p className="font-semibold text-red-600">Are you absolutely sure?</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete your account and all associated data.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}