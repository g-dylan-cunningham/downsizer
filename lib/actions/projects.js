/**
 * Purpose: Server actions for Project CRUD operations.
 * Exports: createProject, getProjects, getProject
 * Invariants:
 * - All operations require authentication.
 * - Every project belongs to exactly one user (ownerUserId).
 * - Never trust client input - always validate ownership server-side.
 */

'use server';

import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth/session';

const prisma = new PrismaClient();

/**
 * Creates a new project owned by the current user.
 * @param {string} name - Project name
 * @returns {Promise<{success: boolean, project?: Object, error?: string}>}
 */
export async function createProject(name) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Project name is required' };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        ownerUserId: user.id,
      },
    });

    return { success: true, project };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Gets all projects owned by the current user.
 * @returns {Promise<{success: boolean, projects?: Array, error?: string}>}
 */
export async function getProjects() {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        ownerUserId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, projects };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { success: false, error: 'Failed to fetch projects' };
  }
}

/**
 * Gets a single project by ID, verifying ownership.
 * @param {string} projectId - Project UUID
 * @returns {Promise<{success: boolean, project?: Object, error?: string}>}
 */
export async function getProject(projectId) {
  const { user, error: authError } = await getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerUserId: user.id,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project };
  } catch (error) {
    console.error('Error fetching project:', error);
    return { success: false, error: 'Failed to fetch project' };
  }
}
