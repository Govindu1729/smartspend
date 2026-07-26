'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowRightLeft, PiggyBank, BarChart3, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/ai-insights', label: 'AI Insights', icon: Sparkles },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        if (isActive) {
          return (
            <span key={item.href} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md text-foreground bg-accent cursor-default">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          );
        }

        return (
          <Link key={item.href} href={item.href} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}