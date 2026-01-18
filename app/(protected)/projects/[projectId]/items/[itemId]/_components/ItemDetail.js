/**
 * Purpose: Client component for displaying item details and uploading images.
 * Exports: ItemDetail component
 * Invariants:
 * - Displays all item metadata
 * - Shows all uploaded images as thumbnails
 * - Allows uploading new photos (creates display + thumb versions)
 * - Uses Supabase Storage (item-images bucket)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadItemImage, getImageUrl } from '@/lib/storage/upload';

export default function ItemDetail({ projectId, item }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const router = useRouter();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const result = await uploadItemImage({
        file,
        projectId,
        itemId: item.id,
      });

      if (result.success) {
        // Refresh the page to show new images
        router.refresh();
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Group images by kind
  const thumbs = item.images.filter((img) => img.kind === 'thumb');

  return (
    <div className="space-y-6">
      {/* Item Details */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Details
        </h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Room
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {item.room.name}
            </dd>
          </div>

          {item.container && (
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Container
              </dt>
              <dd className="mt-1 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-50">
                {item.container.code}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Kind
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50 capitalize">
              {item.kind}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Count
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {item.count}
            </dd>
          </div>

          {item.notes && (
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Notes
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">
                {item.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Image Upload */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Photos
        </h3>

        <div className="space-y-4">
          {/* Upload Button */}
          <div>
            <label className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Images will be automatically resized to display and thumbnail versions.
            </p>
          </div>

          {/* Images Grid */}
          {thumbs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                No photos yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {thumbs.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700"
                >
                  <img
                    src={getImageUrl(image.path)}
                    alt="Item photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
