/**
 * Purpose: Browser-side Supabase client for authentication and data access.
 * Exports: createClient() - returns a configured Supabase client instance.
 * Invariants:
 * - Uses public environment variables (NEXT_PUBLIC_*).
 * - Safe to use in browser contexts (client components).
 * - Uses @supabase/ssr to store PKCE code verifier in cookies for SSR compatibility.
 * - Session and code verifier are persisted in cookies (not localStorage).
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates and returns a Supabase client for browser use.
 * Uses @supabase/ssr to ensure PKCE code verifier is stored in cookies.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, environment variables might not be available
    // Return a mock client to allow build to proceed
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not set during build');
      return null;
    }

    throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY to your environment.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
