/**
 * Purpose: Containers list and create page.
 * Exports: default ContainersPage component.
 * Invariants:
 * - Validates project ownership.
 * - Lists all containers in project.
 * - Allows creating new containers with room selection and auto-generated codes.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import { getContainers } from '@/lib/actions/containers';
import ContainersList from './_components/ContainersList';

export default async function ContainersPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const containersResult = await getContainers(projectId);

  const rooms = roomsResult.success ? roomsResult.rooms : [];
  const containers = containersResult.success ? containersResult.containers : [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/projects/${projectId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to {projectResult.project.name}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Containers
        </h2>
      </div>

      <ContainersList
        projectId={projectId}
        initialContainers={containers}
        rooms={rooms}
      />
    </div>
  );
}
