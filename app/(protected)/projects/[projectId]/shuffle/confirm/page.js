/**
 * Purpose: Confirm move page for Shuffle Mode.
 * Exports: default ConfirmMovePage component.
 * Invariants:
 * - Project ownership validated.
 * - Shows move summary before execution.
 */

import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import MoveConfirmation from './_components/MoveConfirmation';

export default async function ConfirmMovePage({ params }) {
  const { projectId } = await params;

  const projectResult = await getProject(projectId);
  if (!projectResult.success) {
    notFound();
  }

  return <MoveConfirmation projectId={projectId} project={projectResult.project} />;
}
