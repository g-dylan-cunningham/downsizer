/**
 * Purpose: Server actions for ItemImage CRUD operations.
 * Exports: createItemImage, getItemImages
 * Invariants:
 * - All operations validate project ownership via item.
 * - path is the Supabase Storage path.
 * - kind is "thumb" or "display".
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Creates a new item image record.
 * Called after successful upload to Supabase Storage.
 * @param {Object} data - ItemImage data
 * @param {string} data.projectId - Project UUID (for validation)
 * @param {string} data.itemId - Item UUID
 * @param {string} data.path - Supabase Storage path
 * @param {string} data.kind - "thumb" or "display"
 * @returns {Promise<{success: boolean, itemImage?: Object, error?: string}>}
 */
export async function createItemImage(data) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { projectId, itemId, path, kind } = data;

  if (!itemId || !path || !kind) {
    return { success: false, error: 'itemId, path, and kind are required' };
  }

  if (kind !== 'thumb' && kind !== 'display') {
    return { success: false, error: 'kind must be "thumb" or "display"' };
  }

  try {
    // Verify project ownership and item exists
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        projectId,
      },
      include: {
        project: true,
      },
    });

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (item.project.ownerUserId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create item image
    const itemImage = await prisma.itemImage.create({
      data: {
        itemId,
        path,
        kind,
      },
    });

    return { success: true, itemImage };
  } catch (error) {
    console.error('Error creating item image:', error);
    return { success: false, error: 'Failed to create item image' };
  }
}

/**
 * Gets all images for an item.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @param {string} itemId - Item UUID
 * @returns {Promise<{success: boolean, itemImages?: Array, error?: string}>}
 */
export async function getItemImages(projectId, itemId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership and item exists
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        projectId,
      },
      include: {
        project: true,
      },
    });

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (item.project.ownerUserId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get item images
    const itemImages = await prisma.itemImage.findMany({
      where: {
        itemId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return { success: true, itemImages };
  } catch (error) {
    console.error('Error fetching item images:', error);
    return { success: false, error: 'Failed to fetch item images' };
  }
}
