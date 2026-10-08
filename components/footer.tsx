'use client';
import Link from 'next/link';
import { Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold">SmartSpend</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Intelligent personal finance tracking powered by AI
            </p>
          </div>

          {/* Links */}
          <div className="md:text-right">
            <h3 className="font-semibold mb-4 text-sm">Resources</h3>
            <div className="flex flex-wrap gap-4 justify-start md:justify-end text-sm text-muted-foreground">
              <a 
                href="https://github.com/Govindu1729/smartspend" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub
              </a>
              <a 
                href="mailto:support@smartspend.app"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/30 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-2">
            © {currentYear} SmartSpend. Made with{' '}
            <Heart className="h-4 w-4 text-red-500" />
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors text-sm">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
