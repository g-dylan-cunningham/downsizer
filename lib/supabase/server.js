/**
 * Purpose: Server-side Supabase client for authentication checks in server components and middleware.
 * Exports: createClient() - returns a configured Supabase client using Next.js cookies.
 * Invariants:
 * - Uses cookies() from next/headers for session management.
 * - Only safe to use in Server Components, Server Actions, and Route Handlers.
 * - Session is read from cookies and validated on the server.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates and returns a Supabase client for server-side use.
 * Reads session from cookies.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
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
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
