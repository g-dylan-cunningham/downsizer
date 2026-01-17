/**
 * Purpose: Move confirmation component for Shuffle Mode.
 * Exports: MoveConfirmation component
 * Invariants:
 * - Shows move summary with source/destination containers.
 * - Executes move on confirmation.
 * - Offers "Move more from same source" or "Scan new source" after success.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moveItems } from '@/lib/actions/shuffle';

export default function MoveConfirmation({ projectId, project }) {
  const router = useRouter();
  const [sourceContainer, setSourceContainer] = useState(null);
  const [destinationContainer, setDestinationContainer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load data from sessionStorage
  useEffect(() => {
    const sourceData = sessionStorage.getItem('shuffle_sourceContainer');
    const destData = sessionStorage.getItem('shuffle_destinationContainer');
    const itemsData = sessionStorage.getItem('shuffle_selectedItems');

    if (!sourceData || !destData || !itemsData) {
      // Missing data, redirect back
      router.push(`/app/projects/${projectId}/shuffle`);
      return;
    }

    try {
      setSourceContainer(JSON.parse(sourceData));
      setDestinationContainer(JSON.parse(destData));
      setSelectedItems(JSON.parse(itemsData));
    } catch (err) {
      console.error('Failed to parse session data:', err);
      router.push(`/app/projects/${projectId}/shuffle`);
    }
  }, [projectId, router]);

  const handleConfirm = async () => {
    if (!sourceContainer || !destinationContainer || selectedItems.length === 0) {
      setError('Missing required data');
      return;
    }

    setLoading(true);
    setError('');

    const result = await moveItems({
      projectId,
      itemIds: selectedItems,
      fromContainerId: sourceContainer.id,
      toContainerId: destinationContainer.id,
    });

    if (result.success) {
      setSuccess(true);
      // Clear session storage
      sessionStorage.removeItem('shuffle_selectedItems');
      sessionStorage.removeItem('shuffle_destinationContainer');
      // Keep source container for "Move more" option
    } else {
      setError(result.error || 'Failed to move items');
      setLoading(false);
    }
  };

  const handleMoveMore = () => {
    // Keep source container, go back to item list
    router.push(`/app/projects/${projectId}/shuffle/source/${sourceContainer.id}`);
  };

  const handleNewSource = () => {
    // Clear all session data
    sessionStorage.removeItem('shuffle_sourceContainer');
    sessionStorage.removeItem('shuffle_selectedItems');
    sessionStorage.removeItem('shuffle_destinationContainer');
    router.push(`/app/projects/${projectId}/shuffle`);
  };

  const handleCancel = () => {
    // Go back to destination selection
    sessionStorage.removeItem('shuffle_destinationContainer');
    router.push(`/app/projects/${projectId}/shuffle/destination`);
  };

  if (!sourceContainer || !destinationContainer) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-90">Success</p>
                <h1 className="text-xl font-semibold">Items Moved</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Success content */}
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              Move Complete
            </h2>
            <p className="text-green-800 dark:text-green-200">
              Successfully moved {selectedItems.length} items from{' '}
              <span className="font-mono font-semibold">{sourceContainer.code}</span> to{' '}
              <span className="font-mono font-semibold">{destinationContainer.code}</span>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleMoveMore}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors"
            >
              Move More from {sourceContainer.code}
            </button>
            <button
              onClick={handleNewSource}
              className="w-full px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors"
            >
              Scan New Source Container
            </button>
            <Link
              href={`/app/projects/${projectId}`}
              className="block w-full px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors text-center"
            >
              Exit Shuffle Mode
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Confirm Move</p>
              <h1 className="text-xl font-semibold">Review and Confirm</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Move summary */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Move Summary
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">From</p>
              <div className="bg-zinc-100 dark:bg-zinc-700 rounded p-3">
                <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                  {sourceContainer.code}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {sourceContainer.room.name}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <svg
                className="w-6 h-6 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">To</p>
              <div className="bg-zinc-100 dark:bg-zinc-700 rounded p-3">
                <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                  {destinationContainer.code}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {destinationContainer.room.name}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedItems.length}
              </span>{' '}
              {selectedItems.length === 1 ? 'item' : 'items'} will be moved
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Moving Items...' : 'Confirm Move'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
