/**
 * Purpose: Inventory Mode component - focused Android-first tool for item capture with fixed context.
 * Exports: InventoryMode component
 * Invariants:
 * - Project and room context are FIXED (read-only display).
 * - Container selector limited to 6 active containers per room.
 * - All captured items are assigned to selected container.
 * - No global CRUD navigation exposed.
 * - Exit returns to Project Dashboard.
 * - Last selected container persisted to localStorage for Resume feature.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomContainers, createContainer } from '@/lib/actions/containers';
import { createItem } from '@/lib/actions/items';
import { uploadMultipleImages } from '@/lib/storage/upload';

const MAX_PHOTOS = 6;
const MAX_CONTAINERS_PER_ROOM = 6;

export default function InventoryMode({ projectId, project, roomId, room }) {
  const router = useRouter();

  // Refs for file inputs
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Container state
  const [containers, setContainers] = useState([]);
  const [containerId, setContainerId] = useState('');
  const [containerCount, setContainerCount] = useState(0);
  const [loadingContainers, setLoadingContainers] = useState(true);
  const [creatingContainer, setCreatingContainer] = useState(false);

  // Form state (always "single" mode for now - can extend later)
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [createdItemId, setCreatedItemId] = useState(null);

  // Load containers on mount
  useEffect(() => {
    loadContainers();
  }, [projectId, roomId]);

  // Load last selected container from localStorage
  useEffect(() => {
    if (containers.length > 0 && !containerId) {
      const storageKey = `lastContainerId:${projectId}:${roomId}`;
      const savedContainerId = localStorage.getItem(storageKey);

      // Verify saved container still exists in this room
      if (savedContainerId && containers.find((c) => c.id === savedContainerId)) {
        setContainerId(savedContainerId);
      } else {
        // Default to first container
        setContainerId(containers[0].id);
      }
    }
  }, [containers, containerId, projectId, roomId]);

  const loadContainers = async () => {
    setLoadingContainers(true);
    const result = await getRoomContainers(projectId, roomId);

    if (result.success) {
      setContainers(result.containers);
      setContainerCount(result.count);
    } else {
      setError('Failed to load containers');
    }

    setLoadingContainers(false);
  };

  // Handle container selection
  const handleContainerChange = (newContainerId) => {
    setContainerId(newContainerId);
    const storageKey = `lastContainerId:${projectId}:${roomId}`;
    localStorage.setItem(storageKey, newContainerId);
  };

  // Handle creating new container
  const handleCreateContainer = async () => {
    if (containerCount >= MAX_CONTAINERS_PER_ROOM) {
      setError(`Maximum ${MAX_CONTAINERS_PER_ROOM} containers per room`);
      return;
    }

    setCreatingContainer(true);
    setError('');

    const result = await createContainer(projectId, roomId);

    if (result.success) {
      await loadContainers();
      setContainerId(result.container.id);
      const storageKey = `lastContainerId:${projectId}:${roomId}`;
      localStorage.setItem(storageKey, result.container.id);
    } else {
      setError(result.error || 'Failed to create container');
    }

    setCreatingContainer(false);
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
    setNotes('');
    setPhotos([]);
    setPhotoPreviews([]);
    setError('');
    setCreatedItemId(null);
    setUploadProgress({ current: 0, total: 0 });
  };

  // Validate form
  const validateForm = () => {
    if (!containerId) {
      setError('Please select a container');
      return false;
    }

    if (photos.length === 0) {
      setError('Please select at least one photo');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setCreatedItemId(null);

    try {
      // Step 1: Create item with container
      const itemResult = await createItem({
        projectId,
        roomId,
        containerId,
        title: title.trim() || null,
        kind: 'single',
        count: 1,
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

      // Success! Reset form and stay in Inventory Mode
      resetForm();
      setLoading(false);
    } catch (err) {
      console.error('Capture error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle exit
  const handleExit = () => {
    router.push(`/app/projects/${projectId}`);
  };

  if (loadingContainers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-zinc-500 dark:text-zinc-400">Loading Inventory Mode...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Fixed header with context and exit */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Inventory Mode</p>
              <h1 className="text-xl font-semibold">{project.name}</h1>
            </div>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
            >
              Exit Inventory
            </button>
          </div>
          <p className="text-sm opacity-90">Room: {room.name}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        {/* Container selector */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Active Container *
          </label>
          <div className="flex gap-3">
            <select
              value={containerId}
              onChange={(e) => handleContainerChange(e.target.value)}
              disabled={loading || containers.length === 0}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
            >
              <option value="">Select a container</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.code}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCreateContainer}
              disabled={
                loading ||
                creatingContainer ||
                containerCount >= MAX_CONTAINERS_PER_ROOM
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {creatingContainer ? 'Creating...' : 'New'}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {containerCount}/{MAX_CONTAINERS_PER_ROOM} containers in this room
            {containerCount >= MAX_CONTAINERS_PER_ROOM &&
              ' (maximum reached)'}
          </p>
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
              Title (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Blue ceramic vase"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
            />
          </div>

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

        {/* Capture button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Saving...' : 'Capture Item'}
        </button>
      </div>
    </div>
  );
}
