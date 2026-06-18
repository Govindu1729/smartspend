import '@/app/globals.css';
import '@/app/globals.css';

import type { Metadata, Viewport } from 'next';
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
  Settings,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// PWA + SEO metadata (Next.js 16 metadata API)
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: 'SmartSpend — AI-Powered Personal Finance Tracker',
    template: '%s · SmartSpend',
  },
  description:
    'Track income & expenses, set budgets, get AI-powered insights, and receive push alerts before you overspend. Installable PWA, works offline.',
  applicationName: 'SmartSpend',
  keywords: [
    'personal finance',
    'expense tracker',
    'budget planner',
    'AI finance',
    'PWA',
    'Indian students',
    'UPI',
  ],
  authors: [{ name: 'Govindu Srimaan' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'SmartSpend',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'SmartSpend — AI-Powered Personal Finance Tracker',
    description:
      'Track income & expenses, set budgets, get AI-powered insights, and receive push alerts before you overspend.',
    type: 'website',
    siteName: 'SmartSpend',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

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
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {/* Skip-to-content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>

        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />

        {/* Toaster */}
        <Toaster />

        {/* Navigation Bar */}
        <nav className="border-b" aria-label="Primary">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-bold flex items-center gap-2">
                  <PiggyBank className="h-6 w-6" aria-hidden="true" />
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
                        <item.icon className="h-4 w-4" aria-hidden="true" />
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
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Notifications"
                        aria-label="Notifications"
                      >
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <Link href="/settings" className="hidden md:inline-flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Settings"
                        aria-label="Settings"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <form action="/api/auth/signout" method="POST">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="submit"
                        title="Logout"
                        aria-label="Logout"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </form>
                    <div className="md:hidden">
                      <MobileNav userEmail={user.email || ''} />
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
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

        {/* Main Content */}
        <main id="main-content">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
