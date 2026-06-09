import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/toaster';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  PiggyBank, 
  BarChart3, 
  Sparkles,
  LogOut,
  Bell,
  Settings
} from 'lucide-react';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Not authenticated — show public content (landing page)
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

      {/* Toaster */}
      <Toaster />

      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold flex items-center gap-2">
                <PiggyBank className="h-6 w-6" />
                SmartSpend
              </Link>
              {user && (
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
              )}
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Link href="/notifications" className="hidden md:inline-flex">
                    <Button variant="ghost" size="icon" title="Notifications">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/settings" className="hidden md:inline-flex">
                    <Button variant="ghost" size="icon" title="Settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <form action="/api/auth/signout" method="POST">
                    <Button variant="ghost" size="icon" type="submit" title="Logout">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </form>
                  <div className="md:hidden">
                    <MobileNav userEmail={user.email || ''} />
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
