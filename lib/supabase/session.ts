// lib/supabase/session.ts
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export async function getSession(request: NextRequest) {
  // For proxy, we don't need NextResponse.next(), just pass the request
  let response = new Response(null, {
    headers: request.headers,
  });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
        setAll: (cookiesToSet) => {
          const cookieHeader = cookiesToSet
            .map(({ name, value, options }) => {
              let cookie = `${name}=${value}`;
              if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
              if (options?.domain) cookie += `; Domain=${options.domain}`;
              if (options?.path) cookie += `; Path=${options.path}`;
              if (options?.secure) cookie += '; Secure';
              if (options?.httpOnly) cookie += '; HttpOnly';
              if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
              return cookie;
            })
            .join(', ');
          
          response.headers.set('Set-Cookie', cookieHeader);
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user, response };
}
