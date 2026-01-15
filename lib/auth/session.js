/**
 * Purpose: Session management utilities for authentication flows.
 * Exports: getUser() - retrieves current authenticated user server-side.
 * Invariants:
 * - getUser() must be called from server contexts (Server Components, Server Actions).
 * - Returns null if no valid session exists.
 * - Used in middleware and protected layouts for auth checks.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Retrieves the currently authenticated user from the server-side session.
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function getUser() {
  const supabase = await createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}
