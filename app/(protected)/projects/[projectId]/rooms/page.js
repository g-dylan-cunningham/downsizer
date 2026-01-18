/**
 * Purpose: Rooms list and create page.
 * Exports: default RoomsPage component.
 * Invariants:
 * - Validates project ownership.
 * - Lists all rooms in project.
 * - Allows creating new rooms with auto-generated slugs.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import RoomsList from './_components/RoomsList';

export default async function RoomsPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const rooms = roomsResult.success ? roomsResult.rooms : [];

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
          Rooms
        </h2>
      </div>

      <RoomsList projectId={projectId} initialRooms={rooms} />
    </div>
  );
}
