/**
 * Purpose: Single item capture page.
 * Exports: default SingleCapturePage component.
 * Invariants:
 * - Creates items with kind=single, count=1.
 * - Room ID passed via URL param but validated server-side.
 * - Uses shared CaptureForm component.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import CaptureForm from '../_components/CaptureForm';

export default async function SingleCapturePage({ params, searchParams }) {
  const { projectId } = await params;
  const { roomId } = await searchParams;

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
            href={`/app/projects/${projectId}/capture`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Capture
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Capture Single Item
          </h2>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No rooms available
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            You need to create rooms before you can capture items.
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

  // Validate roomId if provided
  let validatedRoomId = roomId;
  if (roomId) {
    const roomExists = rooms.some((r) => r.id === roomId);
    if (!roomExists) {
      // Room doesn't exist or was deleted, fallback to first room
      validatedRoomId = rooms[0].id;
    }
  } else {
    // No roomId provided, use first room
    validatedRoomId = rooms[0].id;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/projects/${projectId}/capture`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Capture
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Capture Single Item
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          For unique items like furniture, jewelry, or photos
        </p>
      </div>

      <CaptureForm
        projectId={projectId}
        rooms={rooms}
        mode="single"
        initialRoomId={validatedRoomId}
      />
    </div>
  );
}
