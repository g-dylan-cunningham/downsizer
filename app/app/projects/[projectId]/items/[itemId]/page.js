/**
 * Purpose: Item detail page with image upload functionality.
 * Exports: default ItemDetailPage component.
 * Invariants:
 * - Validates project ownership and item existence.
 * - Displays item details and all images.
 * - Allows uploading photos (display + thumb versions).
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/actions/projects';
import { getItem } from '@/lib/actions/items';
import ItemDetail from './_components/ItemDetail';

export default async function ItemDetailPage({ params }) {
  const { projectId, itemId } = await params;
  const projectResult = await getProject(projectId);

  if (!projectResult.success) {
    notFound();
  }

  const itemResult = await getItem(projectId, itemId);

  if (!itemResult.success) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/projects/${projectId}/items`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Items
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {itemResult.item.title || 'Untitled Item'}
        </h2>
      </div>

      <ItemDetail projectId={projectId} item={itemResult.item} />
    </div>
  );
}
