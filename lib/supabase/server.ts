import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = ensureSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
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

// Create an admin client with service role for server-side operations
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      'Missing Supabase admin environment variables. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.'
    );
  }

  return createServerClient(url, serviceRole, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      },
    },
  });
}

// Export a ready-to-use admin client for server-side operations
export const supabaseAdmin = createAdminClient();
