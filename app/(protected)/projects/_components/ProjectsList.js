/**
 * Purpose: Client component for listing projects with create functionality.
 * Exports: ProjectsList component
 * Invariants:
 * - Displays all user projects
 * - Inline form to create new projects
 * - Links to project dashboard
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/actions/projects';

export default function ProjectsList({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createProject(name);

    if (result.success) {
      setProjects([result.project, ...projects]);
      setName('');
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Project Form */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Create New Project
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
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
            Create your first project above to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {project.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
