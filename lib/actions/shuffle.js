/**
 * Purpose: Server actions for Shuffle Mode - moving items between containers.
 * Exports: getContainerByQR, getContainerByCode, getContainerItems, moveItems
 * Invariants:
 * - All operations validate project ownership.
 * - Only "containerable" items (not bulky) are returned/moved.
 * - QR format: "container:{containerId}"
 * - Move updates Item.containerId and Item.roomId (if room changes).
 * - One ItemMoveEvent per moved item.
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Parse and validate QR payload to get container.
 * QR format: "container:{containerId}"
 * @param {string} projectId - Project UUID
 * @param {string} qrPayload - QR code string
 * @returns {Promise<{success: boolean, container?: Object, error?: string}>}
 */
export async function getContainerByQR(projectId, qrPayload) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!qrPayload || typeof qrPayload !== 'string') {
    return { success: false, error: 'Invalid QR payload' };
  }

  // Parse QR payload
  if (!qrPayload.startsWith('container:')) {
    return { success: false, error: 'Invalid QR format. Expected: container:{containerId}' };
  }

  const containerId = qrPayload.substring('container:'.length).trim();

  if (!containerId) {
    return { success: false, error: 'Container ID not found in QR code' };
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

    // Get container and verify it belongs to this project
    const container = await prisma.container.findFirst({
      where: {
        id: containerId,
        projectId,
      },
      include: {
        room: true,
      },
    });

    if (!container) {
      return { success: false, error: 'Container not found or does not belong to this project' };
    }

    return { success: true, container };
  } catch (error) {
    console.error('Error fetching container by QR:', error);
    return { success: false, error: 'Failed to fetch container' };
  }
}

/**
 * Get container by code (for manual entry fallback).
 * @param {string} projectId - Project UUID
 * @param {string} code - Container code (e.g., "kitchen-BOX-0001")
 * @returns {Promise<{success: boolean, container?: Object, error?: string}>}
 */
export async function getContainerByCode(projectId, code) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!code || typeof code !== 'string') {
    return { success: false, error: 'Container code required' };
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

    // Get container by code
    const container = await prisma.container.findFirst({
      where: {
        projectId,
        code: code.trim(),
      },
      include: {
        room: true,
      },
    });

    if (!container) {
      return { success: false, error: 'Container not found' };
    }

    return { success: true, container };
  } catch (error) {
    console.error('Error fetching container by code:', error);
    return { success: false, error: 'Failed to fetch container' };
  }
}

/**
 * Get all containerable items in a container.
 * Only returns items with handlingType="containerable" (excludes bulky items).
 * @param {string} projectId - Project UUID
 * @param {string} containerId - Container UUID
 * @returns {Promise<{success: boolean, items?: Array, container?: Object, error?: string}>}
 */
export async function getContainerItems(projectId, containerId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!containerId) {
    return { success: false, error: 'Container ID required' };
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

    // Get container and verify it belongs to project
    const container = await prisma.container.findFirst({
      where: {
        id: containerId,
        projectId,
      },
      include: {
        room: true,
      },
    });

    if (!container) {
      return { success: false, error: 'Container not found' };
    }

    // Get all containerable items in this container
    const items = await prisma.item.findMany({
      where: {
        projectId,
        containerId,
        handlingType: 'containerable', // Exclude bulky items
      },
      include: {
        images: {
          where: {
            kind: 'thumb',
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
        room: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, container, items };
  } catch (error) {
    console.error('Error fetching container items:', error);
    return { success: false, error: 'Failed to fetch items' };
  }
}

/**
 * Move items from one container to another.
 * Creates ItemMoveEvent for each item and updates Item.containerId and Item.roomId.
 * @param {Object} data - Move data
 * @param {string} data.projectId - Project UUID
 * @param {Array<string>} data.itemIds - Array of item UUIDs to move
 * @param {string} data.fromContainerId - Source container UUID
 * @param {string} data.toContainerId - Destination container UUID
 * @returns {Promise<{success: boolean, movedCount?: number, error?: string}>}
 */
export async function moveItems(data) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { projectId, itemIds, fromContainerId, toContainerId } = data;

  // Validate input
  if (!projectId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return { success: false, error: 'Invalid move data' };
  }

  if (!fromContainerId || !toContainerId) {
    return { success: false, error: 'Source and destination containers required' };
  }

  if (fromContainerId === toContainerId) {
    return { success: false, error: 'Source and destination must be different' };
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

    // Verify both containers belong to project
    const [fromContainer, toContainer] = await Promise.all([
      prisma.container.findFirst({
        where: { id: fromContainerId, projectId },
        include: { room: true },
      }),
      prisma.container.findFirst({
        where: { id: toContainerId, projectId },
        include: { room: true },
      }),
    ]);

    if (!fromContainer) {
      return { success: false, error: 'Source container not found' };
    }

    if (!toContainer) {
      return { success: false, error: 'Destination container not found' };
    }

    // Verify all items belong to project and source container
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        projectId,
        containerId: fromContainerId,
      },
    });

    if (items.length !== itemIds.length) {
      return {
        success: false,
        error: 'Some items not found or do not belong to source container',
      };
    }

    // Perform move in transaction
    const movedCount = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const item of items) {
        // Create move event
        await tx.itemMoveEvent.create({
          data: {
            projectId,
            itemId: item.id,
            fromContainerId,
            toContainerId,
            movedByUserId: user.id,
          },
        });

        // Update item's container and room (if room changed)
        await tx.item.update({
          where: { id: item.id },
          data: {
            containerId: toContainerId,
            roomId: toContainer.roomId, // Update room to match destination container
          },
        });

        count++;
      }

      return count;
    });

    return { success: true, movedCount };
  } catch (error) {
    console.error('Error moving items:', error);
    return { success: false, error: 'Failed to move items' };
  }
}
