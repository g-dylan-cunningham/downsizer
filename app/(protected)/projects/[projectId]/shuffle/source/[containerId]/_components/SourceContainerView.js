/**
 * Purpose: Source container view with item selection for Shuffle Mode.
 * Exports: SourceContainerView component
 * Invariants:
 * - Shows container code and room.
 * - Displays items with checkboxes for selection.
 * - Client-side search filtering by title.
 * - "Move" button requires at least 1 selected item.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/storage/upload';

export default function SourceContainerView({ projectId, project, container, items }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase();
    return items.filter((item) => {
      const title = item.title?.toLowerCase() || '';
      return title.includes(term);
    });
  }, [items, searchTerm]);

  const handleToggle = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all filtered items
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleMove = () => {
    // Store selected items in sessionStorage
    sessionStorage.setItem('shuffle_selectedItems', JSON.stringify(Array.from(selectedIds)));
    sessionStorage.setItem('shuffle_sourceContainer', JSON.stringify(container));

    // Navigate to destination selection
    router.push(`/projects/${projectId}/shuffle/destination`);
  };

  const handleRescan = () => {
    router.push(`/projects/${projectId}/shuffle`);
  };

  const allFilteredSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Source Container</p>
              <h1 className="text-xl font-semibold font-mono">{container.code}</h1>
            </div>
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
            >
              Exit
            </Link>
          </div>
          <p className="text-sm opacity-90">Room: {container.room.name}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Search and stats */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {selectedIds.size} of {items.length} items selected
            </p>
            {items.length > 0 && (
              <button
                onClick={handleToggleAll}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search items by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-700 dark:text-zinc-50"
          />
        </div>

        {/* Items list */}
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              {searchTerm ? 'No items match your search' : 'No items in this container'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const thumbImage = item.images?.[0];

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className={`bg-white dark:bg-zinc-800 rounded-lg shadow p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-green-600 border-zinc-300 rounded focus:ring-green-500"
                      />
                    </div>

                    {/* Thumbnail */}
                    {thumbImage && (
                      <div className="flex-shrink-0 w-16 h-16">
                        <img
                          src={getImageUrl(thumbImage.path)}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {item.title || 'Untitled Item'}
                      </p>
                      {item.kind === 'group' && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Group of {item.count}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleRescan}
            className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors"
          >
            Change Source
          </button>
          <button
            onClick={handleMove}
            disabled={selectedIds.size === 0}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
