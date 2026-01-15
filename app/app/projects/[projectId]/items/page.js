/**
 * Purpose: Items list and create page.
 * Exports: default ItemsPage component.
 * Invariants:
 * - Validates project ownership.
 * - Lists all items in project with room and container info.
 * - Allows creating new items with room selection (required) and optional container.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import { getContainers } from '@/lib/actions/containers';
import { getItems } from '@/lib/actions/items';
import ItemsList from './_components/ItemsList';

export default async function ItemsPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const containersResult = await getContainers(projectId);
  const itemsResult = await getItems(projectId);

  const rooms = roomsResult.success ? roomsResult.rooms : [];
  const containers = containersResult.success ? containersResult.containers : [];
  const items = itemsResult.success ? itemsResult.items : [];

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
          Items
        </h2>
      </div>

      <ItemsList
        projectId={projectId}
        initialItems={items}
        rooms={rooms}
        containers={containers}
      />
    </div>
  );
}
