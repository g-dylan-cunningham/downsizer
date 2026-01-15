/**
 * Purpose: Public login page using Supabase email magic link authentication.
 * Exports: default Login component.
 * Invariants:
 * - Accessible to unauthenticated users.
 * - Sends magic link via Supabase Auth.
 * - Shows success/error messages after submission.
 * - Redirects authenticated users to /app/projects.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Force dynamic rendering to avoid build-time pre-rendering
export const dynamic = 'force-dynamic';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [supabase, setSupabase] = useState(null);

  // Initialize Supabase client only in browser
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (!supabase) return;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/app/projects');
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!supabase) {
      setError('Authentication service not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/projects`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the magic link!');
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6 text-center">
            Downsizer Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Enter your email to receive a magic link for passwordless sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
