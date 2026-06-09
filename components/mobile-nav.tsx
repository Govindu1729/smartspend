'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/budgets', label: 'Budgets', icon: PiggyBank },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <Link href="/" className="text-lg font-bold flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              SmartSpend
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="border-b px-4 py-3 text-sm text-muted-foreground">
            {userEmail}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Secondary Actions */}
          <div className="space-y-1 border-t px-2 py-4">
            <Link href="/help" onClick={handleNavClick}>
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <HelpCircle className="mr-3 h-5 w-5" />
                Help & Guide
              </Button>
            </Link>
            <Link href="/notifications" onClick={handleNavClick}>
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <Bell className="mr-3 h-5 w-5" />
                Notifications
              </Button>
            </Link>
            <Link href="/settings" onClick={handleNavClick}>
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t px-2 py-3">
            <form action="/api/auth/signout" method="POST">
              <Button
                variant="ghost"
                type="submit"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
