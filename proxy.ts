// proxy.ts (replaces middleware.ts)
import { getSession } from '@/lib/supabase/session';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { user, response } = await getSession(request);

  // Protect routes that require authentication
  const protectedPaths = ['/dashboard', '/transactions', '/budgets', '/reports', '/ai-insights'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return Response.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return Response.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
