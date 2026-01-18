/**
 * Purpose: Items management page for Management Mode.
 * Exports: default ItemsManagementPage component.
 * Invariants:
 * - Validates project ownership.
 * - Displays items list with room and container info.
 * - Supports single and bulk deletion with confirmation.
 * - Substring filter for searching items.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/actions/projects';
import { getItems } from '@/lib/actions/items';
import ItemsManagement from './_components/ItemsManagement';

export default async function ItemsManagementPage({ params }) {
  const { projectId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const itemsResult = await getItems(projectId);
  const items = itemsResult.success ? itemsResult.items : [];

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
          Manage Items
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View and manage all items in this project
        </p>
      </div>

      <ItemsManagement projectId={projectId} initialItems={items} />
    </div>
  );
}
