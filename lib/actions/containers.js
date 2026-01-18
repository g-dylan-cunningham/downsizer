/**
 * Purpose: Server actions for Container CRUD operations.
 * Exports: createContainer, getContainers, getRoomContainers
 * Invariants:
 * - All operations validate project ownership.
 * - Container code is auto-generated: {roomSlug}-BOX-{seq} (e.g., kitchen-BOX-0001).
 * - seq is per room, starting at 1.
 * - code must be unique per project.
 * - Inventory Mode limits active containers to 6 per room (enforced in UI).
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Generates the next sequence number for a room's containers.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<number>} - Next sequence number
 */
async function getNextSeq(projectId, roomId) {
  const lastContainer = await prisma.container.findFirst({
    where: {
      projectId,
      roomId,
    },
    orderBy: {
      seq: 'desc',
    },
  });

  return lastContainer ? lastContainer.seq + 1 : 1;
}

/**
 * Creates a new container in a room.
 * Auto-generates code and sequence number.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<{success: boolean, container?: Object, error?: string}>}
 */
export async function createContainer(projectId, roomId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

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
      return { success: false, error: 'Room not found' };
    }

    // Generate sequence number
    const seq = await getNextSeq(projectId, roomId);

    // Generate container code: {roomSlug}-BOX-{seq}
    const code = `${room.slug}-BOX-${String(seq).padStart(4, '0')}`;

    // Create container
    const container = await prisma.container.create({
      data: {
        projectId,
        roomId,
        seq,
        code,
      },
      include: {
        room: true,
      },
    });

    return { success: true, container };
  } catch (error) {
    console.error('Error creating container:', error);
    return { success: false, error: 'Failed to create container' };
  }
}

/**
 * Gets all containers for a project.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @returns {Promise<{success: boolean, containers?: Array, error?: string}>}
 */
export async function getContainers(projectId) {
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

    // Get containers with room data
    const containers = await prisma.container.findMany({
      where: {
        projectId,
      },
      include: {
        room: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, containers };
  } catch (error) {
    console.error('Error fetching containers:', error);
    return { success: false, error: 'Failed to fetch containers' };
  }
}

/**
 * Gets all containers for a specific room.
 * Used by Inventory Mode to show room-specific containers.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<{success: boolean, containers?: Array, count?: number, error?: string}>}
 */
export async function getRoomContainers(projectId, roomId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

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
      return { success: false, error: 'Room not found' };
    }

    // Get containers for this room
    const containers = await prisma.container.findMany({
      where: {
        projectId,
        roomId,
      },
      include: {
        room: true,
      },
      orderBy: {
        seq: 'asc',
      },
    });

    return { success: true, containers, count: containers.length };
  } catch (error) {
    console.error('Error fetching room containers:', error);
    return { success: false, error: 'Failed to fetch containers' };
  }
}

/**
 * Gets container details with items.
 * Used for management mode detail panel.
 * @param {string} projectId - Project UUID
 * @param {string} containerId - Container UUID
 * @returns {Promise<{success: boolean, container?: Object, items?: Array, error?: string}>}
 */
export async function getContainerDetails(projectId, containerId) {
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

    // Get container with items
    const container = await prisma.container.findFirst({
      where: {
        id: containerId,
        projectId,
      },
      include: {
        room: true,
        items: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!container) {
      return { success: false, error: 'Container not found' };
    }

    return {
      success: true,
      container: {
        id: container.id,
        code: container.code,
        seq: container.seq,
        room: container.room,
      },
      items: container.items,
    };
  } catch (error) {
    console.error('Error fetching container details:', error);
    return { success: false, error: 'Failed to fetch container details' };
  }
}

/**
 * Deletes a container and unpacks all items in it (sets containerId to null).
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @param {string} containerId - Container UUID
 * @returns {Promise<{success: boolean, itemsUnpacked?: number, error?: string}>}
 */
export async function deleteContainer(projectId, containerId) {
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

    // Verify container belongs to project
    const container = await prisma.container.findFirst({
      where: {
        id: containerId,
        projectId,
      },
    });

    if (!container) {
      return { success: false, error: 'Container not found' };
    }

    // Unpack all items (set containerId to null)
    const updateResult = await prisma.item.updateMany({
      where: {
        containerId,
      },
      data: {
        containerId: null,
      },
    });

    // Delete container
    await prisma.container.delete({
      where: {
        id: containerId,
      },
    });

    return {
      success: true,
      itemsUnpacked: updateResult.count,
    };
  } catch (error) {
    console.error('Error deleting container:', error);
    return { success: false, error: 'Failed to delete container' };
  }
}

/**
 * Deletes multiple containers and unpacks all items in them.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @param {string[]} containerIds - Array of Container UUIDs
 * @returns {Promise<{success: boolean, deleted?: number, itemsUnpacked?: number, error?: string}>}
 */
export async function bulkDeleteContainers(projectId, containerIds) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!Array.isArray(containerIds) || containerIds.length === 0) {
    return { success: false, error: 'Container IDs are required' };
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

    let deleted = 0;
    let itemsUnpacked = 0;

    // Delete each container
    for (const containerId of containerIds) {
      const result = await deleteContainer(projectId, containerId);
      if (result.success) {
        deleted++;
        itemsUnpacked += result.itemsUnpacked || 0;
      }
    }

    return {
      success: true,
      deleted,
      itemsUnpacked,
    };
  } catch (error) {
    console.error('Error bulk deleting containers:', error);
    return { success: false, error: 'Failed to delete containers' };
  }
}
