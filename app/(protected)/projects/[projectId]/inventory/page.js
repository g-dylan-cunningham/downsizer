/**
 * Purpose: Inventory Mode page - focused Android-first tool for capturing items in a fixed room context.
 * Exports: default InventoryPage component.
 * Invariants:
 * - Room context is FIXED once entered (no room switching).
 * - Project context is FIXED (no project switching).
 * - roomId must be provided via searchParams.
 * - Up to 6 active containers per room.
 * - No global CRUD navigation exposed.
 * - Exit returns to Project Dashboard.
 */

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRoom } from '@/lib/actions/rooms';
import InventoryMode from './_components/InventoryMode';

export default async function InventoryPage({ params, searchParams }) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const roomId = resolvedSearchParams?.roomId;

  // Room is required - redirect to dashboard if missing
  if (!roomId) {
    redirect(`/projects/${projectId}`);
  }

  // Load project
  const projectResult = await getProject(projectId);
  if (!projectResult.success) {
    notFound();
  }

  // Load room and verify it belongs to this project
  const roomResult = await getRoom(projectId, roomId);
  if (!roomResult.success) {
    // Room doesn't exist or doesn't belong to project
    redirect(`/projects/${projectId}`);
  }

  return (
    <InventoryMode
      projectId={projectId}
      project={projectResult.project}
      roomId={roomId}
      room={roomResult.room}
    />
  );
}
