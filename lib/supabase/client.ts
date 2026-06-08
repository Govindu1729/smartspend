import { createBrowserClient } from '@supabase/ssr';

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

export function createClient() {
  const { url, key } = ensureSupabaseEnv();
  return createBrowserClient(url, key);
}
