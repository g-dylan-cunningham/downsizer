/**
 * Purpose: Browser-side Supabase client for authentication and data access.
 * Exports: createClient() - returns a configured Supabase client instance.
 * Invariants:
 * - Uses public environment variables (NEXT_PUBLIC_*).
 * - Safe to use in browser contexts (client components).
 * - Session is automatically persisted in localStorage by Supabase.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates and returns a Supabase client for browser use.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
