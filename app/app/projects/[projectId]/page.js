/**
 * Purpose: Project dashboard page - mode hub for Inventory Mode and project management.
 * Exports: default ProjectDashboardPage component.
 * Invariants:
 * - Validates project ownership.
 * - Primary mode is Inventory Mode (Android-first capture).
 * - CRUD sections are supporting tools.
 * - Resume Inventory feature restores last session.
 */

import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getRooms } from '@/lib/actions/rooms';
import ProjectDashboard from './_components/ProjectDashboard';

export default async function ProjectDashboardPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const roomsResult = await getRooms(projectId);
  const rooms = roomsResult.success ? roomsResult.rooms : [];

  return (
    <ProjectDashboard
      projectId={projectId}
      project={projectResult.project}
      rooms={rooms}
    />
  );
}
