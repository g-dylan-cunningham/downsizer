/**
 * Purpose: Shuffle Mode entry page - scan or manually enter source container.
 * Exports: default ShuffleEntryPage component.
 * Invariants:
 * - Project ownership validated server-side.
 * - Provides manual container code entry (primary for MVP).
 * - QR scanning option (future enhancement).
 */

import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import ShuffleEntry from './_components/ShuffleEntry';

export default async function ShuffleEntryPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  return (
    <ShuffleEntry projectId={projectId} project={projectResult.project} />
  );
}
