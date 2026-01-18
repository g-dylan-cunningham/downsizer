/**
 * Purpose: Server actions for Room CRUD operations.
 * Exports: createRoom, getRooms, getRoom
 * Invariants:
 * - All operations validate project ownership.
 * - Slug is generated server-side from name (lowercase, hyphens, collision handling).
 * - slug must be unique per project.
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Generates a URL-safe slug from a room name.
 * @param {string} name - Room name
 * @returns {string} - Slug (lowercase, hyphenated)
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

/**
 * Finds a unique slug for a room within a project.
 * If slug exists, appends -2, -3, etc.
 * @param {string} projectId - Project UUID
 * @param {string} baseSlug - Base slug to check
 * @returns {Promise<string>} - Unique slug
 */
async function findUniqueSlug(projectId, baseSlug) {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.room.findFirst({
      where: {
        projectId,
        slug,
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Creates a new room in a project.
 * Validates project ownership and generates unique slug.
 * @param {string} projectId - Project UUID
 * @param {string} name - Room name
 * @returns {Promise<{success: boolean, room?: Object, error?: string}>}
 */
export async function createRoom(projectId, name) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Room name is required' };
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

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const slug = await findUniqueSlug(projectId, baseSlug);

    // Create room
    const room = await prisma.room.create({
      data: {
        projectId,
        name: name.trim(),
        slug,
      },
    });

    return { success: true, room };
  } catch (error) {
    console.error('Error creating room:', error);
    return { success: false, error: 'Failed to create room' };
  }
}

/**
 * Gets all rooms for a project.
 * Validates project ownership.
 * @param {string} projectId - Project UUID
 * @returns {Promise<{success: boolean, rooms?: Array, error?: string}>}
 */
export async function getRooms(projectId) {
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

    // Get rooms
    const rooms = await prisma.room.findMany({
      where: {
        projectId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, rooms };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return { success: false, error: 'Failed to fetch rooms' };
  }
}

/**
 * Gets a single room by ID.
 * Validates project ownership and room belongs to project.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<{success: boolean, room?: Object, error?: string}>}
 */
export async function getRoom(projectId, roomId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!roomId) {
    return { success: false, error: 'Room ID is required' };
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

    // Get room
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        projectId,
      },
    });

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    return { success: true, room };
  } catch (error) {
    console.error('Error fetching room:', error);
    return { success: false, error: 'Failed to fetch room' };
  }
}

/**
 * Gets room details with item and container counts.
 * Used for management mode detail panel.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<{success: boolean, room?: Object, items?: Array, containers?: Array, error?: string}>}
 */
export async function getRoomDetails(projectId, roomId) {
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

    // Get room with items and containers
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        projectId,
      },
      include: {
        items: {
          include: {
            container: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        containers: {
          orderBy: {
            code: 'asc',
          },
        },
      },
    });

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    return {
      success: true,
      room: {
        id: room.id,
        name: room.name,
        slug: room.slug,
      },
      items: room.items,
      containers: room.containers,
    };
  } catch (error) {
    console.error('Error fetching room details:', error);
    return { success: false, error: 'Failed to fetch room details' };
  }
}

/**
 * Deletes a room if it has no containers.
 * Validates project ownership and checks for containers before deletion.
 * @param {string} projectId - Project UUID
 * @param {string} roomId - Room UUID
 * @returns {Promise<{success: boolean, error?: string, containerCount?: number}>}
 */
export async function deleteRoom(projectId, roomId) {
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

    // Get room and count containers
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        projectId,
      },
      include: {
        _count: {
          select: {
            containers: true,
          },
        },
      },
    });

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Block deletion if room has containers
    if (room._count.containers > 0) {
      return {
        success: false,
        error: 'Cannot delete room with containers',
        containerCount: room._count.containers,
      };
    }

    // Delete room (cascade will delete items)
    await prisma.room.delete({
      where: {
        id: roomId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    return { success: false, error: 'Failed to delete room' };
  }
}

/**
 * Deletes multiple rooms if they have no containers.
 * Validates project ownership and checks each room for containers before deletion.
 * @param {string} projectId - Project UUID
 * @param {string[]} roomIds - Array of Room UUIDs
 * @returns {Promise<{success: boolean, deleted?: number, failed?: Array, error?: string}>}
 */
export async function bulkDeleteRooms(projectId, roomIds) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    return { success: false, error: 'Room IDs are required' };
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

    const failed = [];
    let deleted = 0;

    // Check each room and delete if possible
    for (const roomId of roomIds) {
      const result = await deleteRoom(projectId, roomId);
      if (result.success) {
        deleted++;
      } else {
        failed.push({
          roomId,
          error: result.error,
          containerCount: result.containerCount,
        });
      }
    }

    return {
      success: true,
      deleted,
      failed,
    };
  } catch (error) {
    console.error('Error bulk deleting rooms:', error);
    return { success: false, error: 'Failed to delete rooms' };
  }
}
