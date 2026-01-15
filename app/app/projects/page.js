/**
 * Purpose: Projects page placeholder showing logged-in user and empty state.
 * Exports: default ProjectsPage component.
 * Invariants:
 * - Protected by app layout and middleware.
 * - Shows user email and "No projects yet" message.
 * - Future: will list and manage projects.
 */

import { getUser } from '@/lib/auth/session';

export default async function ProjectsPage() {
  const { user } = await getUser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Projects
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Logged in as: <span className="font-medium">{user?.email}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-700 mb-4">
          <svg
            className="w-8 h-8 text-zinc-400 dark:text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          No projects yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Projects will appear here once you create your first one.
        </p>
      </div>
    </div>
  );
}
