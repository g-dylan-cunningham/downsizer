/**
 * Purpose: Protected app layout with navigation shell and logout.
 * Exports: default AppLayout component.
 * Invariants:
 * - User must be authenticated to access (enforced by middleware).
 * - Displays user email in header.
 * - Provides navigation to app sections.
 * - Logout button clears session and redirects to /login.
 */

import { getUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default async function AppLayout({ children }) {
  const { user } = await getUser();

  // If no user, redirect to login (redundant with middleware, but good defensive check)
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header / Navigation */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* App name and user info */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Downsizer
              </h1>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </span>
            </div>

            {/* Logout button */}
            <LogoutButton />
          </div>

          {/* Navigation links */}
          <nav className="flex space-x-6 pb-4">
            <a
              href="/app/projects"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Projects
            </a>
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
              Rooms
            </span>
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
              Items
            </span>
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
              Containers
            </span>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
