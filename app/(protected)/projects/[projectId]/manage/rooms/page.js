/**
 * Purpose: Rooms management page for Management Mode.
 * Exports: default RoomsManagementPage component.
 * Invariants:
 * - Validates project ownership.
 * - Displays rooms list with detail panel.
 * - Supports room deletion (blocked if containers exist).
 * - Supports bulk deletion with confirmation.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import RoomsManagement from './_components/RoomsManagement';

export default async function RoomsManagementPage({ params }) {
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
          Manage Rooms
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View and manage rooms, their items, and containers
        </p>
      </div>

      <RoomsManagement projectId={projectId} initialRooms={rooms} />
    </div>
  );
}
