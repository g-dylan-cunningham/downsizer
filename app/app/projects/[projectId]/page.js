/**
 * Purpose: Project dashboard with links to rooms, containers, and items.
 * Exports: default ProjectDashboard component.
 * Invariants:
 * - Validates project ownership.
 * - Shows navigation to all sub-sections.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';

export default async function ProjectDashboard({ params }) {
  const { projectId } = await params;
  const result = await getProject(projectId);

  if (!result.success) {
    notFound();
  }

  const { project } = result;

  const sections = [
    {
      name: 'Capture',
      href: `/app/projects/${projectId}/capture`,
      description: 'Quick capture workflow for staff',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      ),
      primary: true,
    },
    {
      name: 'Rooms',
      href: `/app/projects/${projectId}/rooms`,
      description: 'Manage rooms within this project',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      name: 'Containers',
      href: `/app/projects/${projectId}/containers`,
      description: 'Manage boxes and containers',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
    },
    {
      name: 'Items',
      href: `/app/projects/${projectId}/items`,
      description: 'View and manage all items',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/projects"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Projects
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {project.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary section - Capture */}
        {sections.filter(s => s.primary).map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="block bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {section.icon}
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-semibold text-white">
                  {section.name}
                </h3>
                <p className="mt-1 text-blue-100">
                  {section.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}

        {/* Other sections */}
        <div className="grid gap-6 md:grid-cols-3">
          {sections.filter(s => !s.primary).map((section) => (
            <Link
              key={section.name}
              href={section.href}
              className="block bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {section.icon}
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {section.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
