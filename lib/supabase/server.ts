import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

function ensureSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.'
    );
  }
  return { url, key };
}

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use this in Server Components, Route Handlers, and Server Actions —
 * it respects RLS because it carries the user's session.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = ensureSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Partial<{ path: string; maxAge: number; domain: string; secure: boolean; httpOnly: boolean; sameSite: 'strict' | 'lax' | 'none' }>)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Service-role admin client. **Bypasses RLS.** Lazy-initialized so missing
 * env vars only throw when actually used, not at module load.
 *
 * Only use for trusted server-side operations that must cross user boundaries
 * (e.g. scheduled cleanup jobs). Never use for user-scoped reads/writes —
 * prefer `createClient()` + `getAuthenticatedUser()` so RLS applies.
 */
let _adminClient: ReturnType<typeof createServerClient> | null = null;
export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      'Missing Supabase admin environment variables. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.'
    );
  }

  _adminClient = createServerClient(url, serviceRole, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      },
    },
  });
  return _adminClient;
}

/**
 * Back-compat alias. Prefer `getSupabaseAdmin()` for new code.
 * @deprecated Use `getSupabaseAdmin()` instead.
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createServerClient>, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Get the authenticated user for the current request, or null.
 * Use this in every Route Handler instead of trusting a client-supplied `user_id`.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
