/**
 * Purpose: Server actions for Container CRUD operations.
 * Exports: createContainer, getContainers
 * Invariants:
 * - All operations validate project ownership.
 * - Container code is auto-generated: {roomSlug}-BOX-{seq} (e.g., kitchen-BOX-0001).
 * - seq is per room, starting at 1.
 * - code must be unique per project.
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
