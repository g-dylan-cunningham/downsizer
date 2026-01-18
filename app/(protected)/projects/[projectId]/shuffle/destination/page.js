/**
 * Purpose: Destination container selection page for Shuffle Mode.
 * Exports: default DestinationPage component.
 * Invariants:
 * - Project ownership validated.
 * - Offers manual entry or create new container.
 */

import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import DestinationSelection from './_components/DestinationSelection';

export default async function DestinationPage({ params }) {
  const { projectId } = await params;

  const projectResult = await getProject(projectId);
  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const rooms = roomsResult.success ? roomsResult.rooms : [];

  return (
    <DestinationSelection
      projectId={projectId}
      project={projectResult.project}
      rooms={rooms}
    />
  );
}
