/**
 * Purpose: Supabase Storage upload utilities for item images.
 * Exports: uploadItemImage, uploadMultipleImages
 * Invariants:
 * - Bucket: item-images (public)
 * - Path pattern: projects/{projectId}/items/{itemId}/{uuid}_{kind}.jpg
 * - One UUID per photo (used for both display and thumb variants)
 * - Uploads both display and thumb versions
 * - Sequential processing to avoid memory issues on mobile
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
      // Upload succeeded but DB insert failed - log and clean up
      console.error('Upload succeeded but DB record failed for display:', displayPath);
      await supabase.storage.from('item-images').remove([displayPath, thumbPath]);
      return {
        success: false,
        error: 'Upload succeeded but record failed—retry from item detail page',
        uploadSucceeded: true,
      };
    }

    const thumbResult = await createItemImage({
      projectId,
      itemId,
      path: thumbPath,
      kind: 'thumb',
    });

    if (!thumbResult.success) {
      // Upload succeeded but DB insert failed - log and clean up
      console.error('Upload succeeded but DB record failed for thumb:', thumbPath);
      await supabase.storage.from('item-images').remove([displayPath, thumbPath]);
      return {
        success: false,
        error: 'Upload succeeded but record failed—retry from item detail page',
        uploadSucceeded: true,
      };
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
 * Uploads multiple images sequentially for an item.
 * Processes one image at a time to avoid memory issues on mobile.
 * @param {Object} params - Upload parameters
 * @param {File[]} params.files - Array of image files
 * @param {string} params.projectId - Project UUID
 * @param {string} params.itemId - Item UUID
 * @param {Function} params.onProgress - Progress callback (current, total)
 * @returns {Promise<{success: boolean, results: Array, failedCount: number}>}
 */
export async function uploadMultipleImages({ files, projectId, itemId, onProgress }) {
  const results = [];
  let failedCount = 0;

  // Process images sequentially to avoid memory issues
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    try {
      const result = await uploadItemImage({ file, projectId, itemId });

      results.push({
        file: file.name,
        success: result.success,
        error: result.error,
        paths: result.paths,
        uploadSucceeded: result.uploadSucceeded,
      });

      if (!result.success) {
        failedCount++;
      }
    } catch (error) {
      console.error('Error uploading image:', file.name, error);
      results.push({
        file: file.name,
        success: false,
        error: 'Unexpected error during upload',
      });
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    results,
    failedCount,
    totalCount: files.length,
  };
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
