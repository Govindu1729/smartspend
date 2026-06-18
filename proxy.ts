// proxy.ts (Next.js 16 replacement for middleware.ts)
//
// Handles session refresh + route protection in Next.js 16.
// Docs: https://nextjs.org/docs/messages/middleware-to-proxy
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow requests when env vars are not configured (dev mode)
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => {
        const cookieHeader = request.headers.get('cookie') || '';
        return cookieHeader.split(';').map(cookie => {
          const [name, ...valueParts] = cookie.trim().split('=');
          return {
            name: name.trim(),
            value: valueParts.join('=').trim(),
          };
        }).filter(cookie => cookie.name);
      },
      setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as object);
        });
      },
    },
  });

  // Refresh the user's session (if expired) by calling getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ['/transactions', '/budgets', '/reports', '/ai-insights', '/settings', '/notifications', '/help'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|icons/.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
