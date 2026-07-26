import '@/app/globals.css';

import type { Metadata, Viewport } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/toaster';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { ThemeProvider } from '@/components/theme-provider';
import { NavLinks } from '@/components/nav-links';
import { ThemeToggle } from '@/components/theme-toggle';

import {
  LogOut,
  Bell,
  Settings,
  Wallet,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// PWA + SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: 'SmartSpend — AI-Powered Personal Finance Tracker',
    template: '%s · SmartSpend',
  },
  description:
    'Track income & expenses, set budgets, get AI-powered insights, and receive push alerts before you overspend.',
  applicationName: 'SmartSpend',
  manifest: '/manifest.json',
  keywords: [
    'personal finance',
    'expense tracker',
    'budget planner',
    'AI finance',
    'PWA',
    'UPI',
    'students',
  ],
  authors: [{ name: 'Govindu Srimaan' }],
  appleWebApp: {
    capable: true,
    title: 'SmartSpend',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      {
        url: '/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
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
    {
      media: '(prefers-color-scheme: light)',
      color: '#4f46e5',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#4f46e5',
    },
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
    // User not authenticated
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'User';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {/* Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>

          {/* PWA */}
          <ServiceWorkerRegistration />

          {/* Toasts */}
          <Toaster />

          {/* Navbar */}
          <nav
            className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg"
            aria-label="Primary"
          >
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-8">
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg"
                  >
                    <div className="rounded-lg btn-gradient p-1.5">
                      <Wallet
                        className="h-4 w-4 text-white"
                        aria-hidden="true"
                      />
                    </div>

                    <span className="gradient-text hidden sm:inline">
                      SmartSpend
                    </span>
                  </Link>

                  {user && <NavLinks />}
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                  {user ? (
                    <>
                      <span className="hidden rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground capitalize md:inline">
                        {displayName}
                      </span>

                      <ThemeToggle />

                      <Link
                        href="/notifications"
                        className="hidden md:inline-flex"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Notifications"
                          aria-label="Notifications"
                        >
                          <Bell
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </Link>

                      <Link
                        href="/settings"
                        className="hidden md:inline-flex"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Settings"
                          aria-label="Settings"
                        >
                          <Settings
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </Link>

                      <form
                        action="/api/auth/signout"
                        method="POST"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          title="Logout"
                          aria-label="Logout"
                        >
                          <LogOut
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </form>

                      <div className="md:hidden">
                        <MobileNav
                          userEmail={user.email || ''}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <ThemeToggle />

                      <div className="flex gap-2">
                        <Link href="/login">
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            Sign In
                          </Button>
                        </Link>

                        <Link href="/signup">
                          <Button
                            size="sm"
                            className="btn-gradient"
                          >
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Main */}
          <main
            id="main-content"
            className="relative"
          >
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}