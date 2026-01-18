/**
 * Purpose: Projects list page with create functionality.
 * Exports: default ProjectsPage component.
 * Invariants:
 * - Protected by app layout and middleware.
 * - Lists all projects owned by user.
 * - Allows creating new projects.
 */

import { getUser } from '@/lib/auth/session';
import { getProjects } from '@/lib/actions/projects';
import ProjectsList from './_components/ProjectsList';

export default async function ProjectsPage() {
  const { user } = await getUser();
  const { projects } = await getProjects();

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

      <ProjectsList initialProjects={projects || []} />
    </div>
  );
}
