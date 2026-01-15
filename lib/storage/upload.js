/**
 * Purpose: Supabase Storage upload utilities for item images.
 * Exports: uploadItemImage
 * Invariants:
 * - Bucket: item-images (public)
 * - Path pattern: projects/{projectId}/items/{itemId}/{uuid}_{kind}.jpg
 * - Uploads both display and thumb versions
 */

import { createClient } from '@/lib/supabase/client';
import { createImageVersions } from './image-resize';
import { createItemImage } from '@/lib/actions/item-images';

/**
 * Generates a UUID v4.
 * @returns {string} - UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Uploads an item image to Supabase Storage.
 * Creates both display and thumbnail versions.
 * @param {Object} params - Upload parameters
 * @param {File} params.file - Original image file
 * @param {string} params.projectId - Project UUID
 * @param {string} params.itemId - Item UUID
 * @returns {Promise<{success: boolean, paths?: {display: string, thumb: string}, error?: string}>}
 */
export async function uploadItemImage({ file, projectId, itemId }) {
  try {
    // Create resized versions
    const { display, thumb } = await createImageVersions(file);

    const supabase = createClient();
    const uuid = generateUUID();

    // Upload display version
    const displayPath = `projects/${projectId}/items/${itemId}/${uuid}_display.jpg`;
    const { error: displayError } = await supabase.storage
      .from('item-images')
      .upload(displayPath, display, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (displayError) {
      console.error('Display upload error:', displayError);
      return { success: false, error: 'Failed to upload display image' };
    }

    // Upload thumb version
    const thumbPath = `projects/${projectId}/items/${itemId}/${uuid}_thumb.jpg`;
    const { error: thumbError } = await supabase.storage
      .from('item-images')
      .upload(thumbPath, thumb, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (thumbError) {
      console.error('Thumb upload error:', thumbError);
      // Try to clean up display image
      await supabase.storage.from('item-images').remove([displayPath]);
      return { success: false, error: 'Failed to upload thumbnail' };
    }

    // Create database records for both images
    const displayResult = await createItemImage({
      projectId,
      itemId,
      path: displayPath,
      kind: 'display',
    });

    if (!displayResult.success) {
      // Clean up uploaded files
      await supabase.storage.from('item-images').remove([displayPath, thumbPath]);
      return { success: false, error: 'Failed to save display image record' };
    }

    const thumbResult = await createItemImage({
      projectId,
      itemId,
      path: thumbPath,
      kind: 'thumb',
    });

    if (!thumbResult.success) {
      // Clean up uploaded files
      await supabase.storage.from('item-images').remove([displayPath, thumbPath]);
      return { success: false, error: 'Failed to save thumbnail record' };
    }

    return {
      success: true,
      paths: {
        display: displayPath,
        thumb: thumbPath,
      },
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Gets the public URL for an item image from Supabase Storage.
 * @param {string} path - Storage path
 * @returns {string} - Public URL
 */
export function getImageUrl(path) {
  const supabase = createClient();
  const { data } = supabase.storage.from('item-images').getPublicUrl(path);
  return data.publicUrl;
}
