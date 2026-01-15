/**
 * Purpose: Server actions for Room CRUD operations.
 * Exports: createRoom, getRooms
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
