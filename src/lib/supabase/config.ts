/**
 * Centralized Supabase Configuration & Validation
 *
 * Reads public URL and publishable/anon key from environment variables.
 * Provides safe fallback and explicit setup guidance when credentials are missing.
 */

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !key.includes('your-supabase')
  );

  return { url, key, isConfigured };
}

export function assertSupabaseConfig(): { url: string; key: string } {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error(
      'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to enable account authentication.'
    );
  }
  return { url: config.url, key: config.key };
}
