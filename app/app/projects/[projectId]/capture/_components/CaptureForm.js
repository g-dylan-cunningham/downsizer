/**
 * Purpose: Shared capture form component for single and group item capture.
 * Exports: CaptureForm component
 * Invariants:
 * - Photo limit: 6 photos max per item.
 * - Room selector always visible (can change without going back).
 * - Sequential image processing (one at a time) to avoid memory issues.
 * - Progress UI shows "Uploading 2/6..." during upload.
 * - Failure handling: if item created but uploads fail, show error + link to item.
 * - "Save & Next" resets form and stays in capture mode.
 * - "Save & View Item" navigates to item detail page.
 * - Camera capture: "Take Photo" button triggers device camera (Android-first).
 * - Gallery selection: "Add Photos" button allows selecting from gallery.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createItem } from '@/lib/actions/items';
import { uploadMultipleImages } from '@/lib/storage/upload';

const MAX_PHOTOS = 6;

export default function CaptureForm({
  projectId,
  rooms,
  mode, // 'single' or 'group'
  initialRoomId,
}) {
  const router = useRouter();

  // Refs for file inputs
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Form state
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(mode === 'group' ? 2 : 1);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [createdItemId, setCreatedItemId] = useState(null);

  // Sync roomId with initialRoomId if it changes
  useEffect(() => {
    if (initialRoomId && !roomId) {
      setRoomId(initialRoomId);
    }
  }, [initialRoomId, roomId]);

  // Persist room selection to localStorage
  const handleRoomChange = (newRoomId) => {
    setRoomId(newRoomId);
    const storageKey = `lastRoomId:${projectId}`;
    localStorage.setItem(storageKey, newRoomId);
  };

  // Handle photo selection
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed per item`);
      return;
    }

    setError('');

    // Add files to photos array
    setPhotos((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo
  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setCount(mode === 'group' ? 2 : 1);
    setNotes('');
    setPhotos([]);
    setPhotoPreviews([]);
    setError('');
    setCreatedItemId(null);
    setUploadProgress({ current: 0, total: 0 });
  };

  // Validate form
  const validateForm = () => {
    if (!roomId) {
      setError('Please select a room');
      return false;
    }

    if (photos.length === 0) {
      setError('Please select at least one photo');
      return false;
    }

    if (mode === 'group' && count < 2) {
      setError('Group items require count of 2 or more');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (action) => {
    // action is 'next' or 'view'

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setCreatedItemId(null);

    try {
      // Step 1: Create item
      const itemResult = await createItem({
        projectId,
        roomId,
        title: title.trim() || null,
        kind: mode,
        count: mode === 'group' ? parseInt(count) : 1,
        notes: notes.trim() || null,
      });

      if (!itemResult.success) {
        setError(itemResult.error || 'Failed to create item');
        setLoading(false);
        return;
      }

      const itemId = itemResult.item.id;
      setCreatedItemId(itemId);

      // Step 2: Upload photos sequentially with progress
      const uploadResult = await uploadMultipleImages({
        files: photos,
        projectId,
        itemId,
        onProgress: (current, total) => {
          setUploadProgress({ current, total });
        },
      });

      if (!uploadResult.success) {
        // Item created but some uploads failed
        setError(
          `Item created but ${uploadResult.failedCount} of ${uploadResult.totalCount} photos failed to upload. You can retry from the item detail page.`
        );
        setLoading(false);
        return;
      }

      // Success!
      if (action === 'next') {
        // Reset form and stay in capture mode
        resetForm();
        setLoading(false);
      } else {
        // Navigate to item detail page
        router.push(`/app/projects/${projectId}/items/${itemId}`);
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Room selector */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Room *
        </label>
        <select
          value={roomId}
          onChange={(e) => handleRoomChange(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
        >
          <option value="">Select a room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {/* Photo selection */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Photos * (up to {MAX_PHOTOS})
        </label>

        {/* Photo previews */}
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={loading}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          disabled={loading}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          disabled={loading}
          className="hidden"
        />

        {/* Photo capture buttons */}
        {photos.length < MAX_PHOTOS && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
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
              Add from Gallery
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {photos.length}/{MAX_PHOTOS} photos selected
        </p>
      </div>

      {/* Form fields */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Title {mode === 'single' ? '(optional)' : '(recommended)'}
          </label>
          <input
            type="text"
            placeholder={
              mode === 'single'
                ? 'e.g., Blue ceramic vase'
                : 'e.g., Kitchen utensils'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
          />
        </div>

        {mode === 'group' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Count * (2 or more)
            </label>
            <input
              type="number"
              min="2"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            rows={3}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Upload progress */}
      {loading && uploadProgress.total > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Uploading photos: {uploadProgress.current} / {uploadProgress.total}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          {createdItemId && (
            <button
              onClick={() =>
                router.push(`/app/projects/${projectId}/items/${createdItemId}`)
              }
              className="mt-2 text-sm text-red-800 dark:text-red-200 underline hover:no-underline"
            >
              Open item to retry uploads
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSubmit('next')}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save & Next'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('view')}
          disabled={loading}
          className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors disabled:opacity-50"
        >
          Save & View
        </button>
      </div>
    </div>
  );
}
