/**
 * Purpose: Containers management page for Management Mode.
 * Exports: default ContainersManagementPage component.
 * Invariants:
 * - Validates project ownership.
 * - Displays containers list with detail panel.
 * - Supports container deletion (unpacks items).
 * - Supports bulk deletion with confirmation.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import { getContainers } from '@/lib/actions/containers';
import ContainersManagement from './_components/ContainersManagement';

export default async function ContainersManagementPage({ params }) {
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
          href={`/projects/${projectId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to {projectResult.project.name}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Manage Containers
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View and manage containers and their items
        </p>
      </div>

      <ContainersManagement
        projectId={projectId}
        initialContainers={containers}
        rooms={rooms}
      />
    </div>
  );
}
