/**
 * Purpose: Source container item list page for Shuffle Mode.
 * Exports: default SourceContainerPage component.
 * Invariants:
 * - Shows only containerable items (excludes bulky).
 * - Container must belong to project.
 * - Supports item selection via checkboxes.
 */

import { notFound, redirect } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getContainerItems } from '@/lib/actions/shuffle';
import SourceContainerView from './_components/SourceContainerView';

export default async function SourceContainerPage({ params }) {
  const { projectId, containerId } = await params;

  const projectResult = await getProject(projectId);
  if (!projectResult.success) {
    notFound();
  }

  const result = await getContainerItems(projectId, containerId);
  if (!result.success) {
    // Redirect back to shuffle entry if container not found
    redirect(`/app/projects/${projectId}/shuffle`);
  }

  return (
    <SourceContainerView
      projectId={projectId}
      project={projectResult.project}
      container={result.container}
      items={result.items}
    />
  );
}
