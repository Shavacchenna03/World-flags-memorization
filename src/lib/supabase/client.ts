import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

/**
 * Creates or retrieves a singleton Supabase client for browser contexts.
 * Persists session using browser cookies managed by @supabase/ssr.
 */
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, key, isConfigured } = getSupabaseConfig();

  // If not configured, instantiate with placeholder so client-side components render
  // and display actionable setup instructions rather than hard-crashing.
  browserClient = createBrowserClient(
    isConfigured ? url : 'https://unconfigured-project.supabase.co',
    isConfigured ? key : 'unconfigured-key'
  );

  return browserClient;
}
