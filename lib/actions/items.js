/**
 * Purpose: Server actions for Item CRUD operations.
 * Exports: createItem, getItems, getItem
 * Invariants:
 * - All operations validate project ownership.
 * - Every item must belong to a room (roomId required).
 * - Validates room belongs to project.
 * - containerId is optional.
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Creates a new item in a project.
 * @param {Object} data - Item data
 * @param {string} data.projectId - Project UUID
 * @param {string} data.roomId - Room UUID (required)
 * @param {string} data.containerId - Container UUID (optional)
 * @param {string} data.title - Item title (optional)
 * @param {string} data.kind - "single" or "group"
 * @param {number} data.count - Item count (default 1)
 * @param {string} data.notes - Item notes (optional)
 * @returns {Promise<{success: boolean, item?: Object, error?: string}>}
 */
export async function createItem(data) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { projectId, roomId, containerId, title, kind, count, notes } = data;

  if (!roomId) {
    return { success: false, error: 'Room is required' };
  }

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerUserId: user.id,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Verify room belongs to project
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        projectId,
      },
    });

    if (!room) {
      return { success: false, error: 'Room not found or does not belong to project' };
    }

    // If containerId provided, verify it belongs to project
    if (containerId) {
      const container = await prisma.container.findFirst({
        where: {
          id: containerId,
          projectId,
        },
      });

      if (!container) {
        return { success: false, error: 'Container not found or does not belong to project' };
      }
    }

    // Create item
    const item = await prisma.item.create({
      data: {
        projectId,
        roomId,
        containerId: containerId || null,
        title: title?.trim() || null,
        kind: kind || 'single',
        count: count || 1,
        notes: notes?.trim() || null,
      },
      include: {
        room: true,
        container: true,
      },
    });

    return { success: true, item };
  } catch (error) {
    console.error('Error creating item:', error);
    return { success: false, error: 'Failed to create item' };
  }
}

/**
 * Gets all items for a project.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @returns {Promise<{success: boolean, items?: Array, error?: string}>}
 */
export async function getItems(projectId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerUserId: user.id,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Get items with room and container data
    const items = await prisma.item.findMany({
      where: {
        projectId,
      },
      include: {
        room: true,
        container: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, items };
  } catch (error) {
    console.error('Error fetching items:', error);
    return { success: false, error: 'Failed to fetch items' };
  }
}

/**
 * Gets a single item by ID.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @param {string} itemId - Item UUID
 * @returns {Promise<{success: boolean, item?: Object, error?: string}>}
 */
export async function getItem(projectId, itemId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerUserId: user.id,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Get item with related data
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        projectId,
      },
      include: {
        room: true,
        container: true,
        images: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    return { success: true, item };
  } catch (error) {
    console.error('Error fetching item:', error);
    return { success: false, error: 'Failed to fetch item' };
  }
}
