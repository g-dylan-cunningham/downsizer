/**
 * Purpose: Capture entry page for selecting room and starting capture mode.
 * Exports: default CapturePage component.
 * Invariants:
 * - Room selection required before capture can start.
 * - Last selected room is persisted in localStorage per project.
 * - If saved room was deleted, fallback to first room and show notice.
 * - Room selection persists immediately on change.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import CaptureEntry from './_components/CaptureEntry';

export default async function CapturePage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const rooms = roomsResult.success ? roomsResult.rooms : [];

  if (rooms.length === 0) {
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
            Capture
          </h2>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No rooms yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            You need to create rooms before you can start capturing items.
          </p>
          <Link
            href={`/app/projects/${projectId}/rooms`}
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Create Rooms
          </Link>
        </div>
      </div>
    );
  }

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
          Capture
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Select a room and start capturing items
        </p>
      </div>

      <CaptureEntry projectId={projectId} rooms={rooms} />
    </div>
  );
}
