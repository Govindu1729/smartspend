import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  PiggyBank, 
  BarChart3, 
  Sparkles,
  LogOut 
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/budgets', label: 'Budgets', icon: PiggyBank },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Service Worker Registration */}
      <ServiceWorkerRegistration />

      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold flex items-center gap-2">
                <PiggyBank className="h-6 w-6" />
                SmartSpend
              </Link>
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <form action="/api/auth/signout" method="POST">
                <Button variant="ghost" size="icon" type="submit">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
