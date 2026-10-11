import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

/**
 * Creates a server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers with Next.js 15 asynchronous cookie handling.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key, isConfigured } = getSupabaseConfig();

  return createServerClient(
    isConfigured ? url : 'https://unconfigured-project.supabase.co',
    isConfigured ? key : 'unconfigured-key',
    {
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
            // This can be ignored if middleware is refreshing user sessions.
          }
        },
      },
    }
  );
}
