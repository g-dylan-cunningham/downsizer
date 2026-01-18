/**
 * Purpose: Auth callback handler for magic link / OAuth flows.
 * Exports: GET handler that exchanges auth code for session and sets cookies.
 * Invariants:
 * - Receives code from URL params (magic link).
 * - Exchanges code for session server-side using PKCE.
 * - Sets session in cookies for SSR auth using NextResponse pattern.
 * - Redirects to intended destination or /projects.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/projects';

  if (!code) {
    // No code provided, redirect to login
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${requestUrl.origin}${next}`);

  // Create Supabase client with route handler cookie pattern
  // This allows setting cookies on the response object
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the auth code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
  }

  return response;
}
