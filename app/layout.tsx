import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
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

import { LogOut, Bell, Settings, Wallet } from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: { default: 'SmartSpend — AI-Powered Personal Finance Tracker', template: '%s · SmartSpend' },
  description: 'Track income & expenses, set budgets, get AI-powered insights, and receive push alerts before you overspend.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 5, viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {}

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
          <ServiceWorkerRegistration />
          <Toaster />

          <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg" aria-label="Primary">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                    <div className="p-1.5 rounded-lg btn-gradient"><Wallet className="h-4 w-4 text-white" /></div>
                    <span className="gradient-text hidden sm:inline">SmartSpend</span>
                  </Link>
                  {user && <NavLinks />}
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <>
                      <span className="hidden md:inline text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted capitalize">{displayName}</span>
                      <ThemeToggle />
                      <Link href="/notifications" className="hidden md:inline-flex"><Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-4 w-4" /></Button></Link>
                      <Link href="/settings" className="hidden md:inline-flex"><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></Link>
                      <form action="/api/auth/signout" method="POST"><Button variant="ghost" size="icon" type="submit" aria-label="Logout"><LogOut className="h-4 w-4" /></Button></form>
                      <div className="md:hidden"><MobileNav userEmail={user.email || ''} /></div>
                    </>
                  ) : (
                    <>
                      <ThemeToggle />
                      <div className="flex gap-2">
                        <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                        <Link href="/signup"><Button size="sm" className="btn-gradient">Get Started</Button></Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <main id="main-content" className="relative">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}