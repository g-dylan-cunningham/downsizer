/**
 * Purpose: Items management component with filtering and bulk operations.
 * Exports: ItemsManagement component
 * Invariants:
 * - Displays all items in project.
 * - Shows room and container info for each item.
 * - Single and bulk delete with confirmation.
 * - Substring filter for searching items.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteItem, bulkDeleteItems } from '@/lib/actions/items';

export default function ItemsManagement({ projectId, initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single' | 'bulk', itemId?: string }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDeleteItem = async (itemId) => {
    setLoading(true);
    setError('');
    const result = await deleteItem(projectId, itemId);

    if (result.success) {
      setItems(items.filter((i) => i.id !== itemId));
      setDeleteTarget(null);
      setShowDeleteModal(false);
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setLoading(true);
    setError('');
    const result = await bulkDeleteItems(projectId, selectedItems);

    if (result.success) {
      setItems(items.filter((i) => !selectedItems.includes(i.id)));
      setSelectedItems([]);
      setDeleteTarget(null);
      setShowDeleteModal(false);
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((i) => i.id));
    }
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!filter) return items;

    const lowerFilter = filter.toLowerCase();
    return items.filter((item) =>
      (item.title && item.title.toLowerCase().includes(lowerFilter)) ||
      (item.notes && item.notes.toLowerCase().includes(lowerFilter)) ||
      (item.room.name && item.room.name.toLowerCase().includes(lowerFilter)) ||
      (item.container?.code && item.container.code.toLowerCase().includes(lowerFilter))
    );
  }, [items, filter]);

  return (
    <div className="space-y-6">
      {/* Filter Input */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <input
          type="text"
          placeholder="Filter items by title, notes, room, or container..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50"
        />
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {filteredItems.length} item(s) {filter && `matching "${filter}"`}
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-blue-900 dark:text-blue-100">
            {selectedItems.length} item(s) selected
          </span>
          <button
            onClick={() => {
              setDeleteTarget({ type: 'bulk' });
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            {filter ? 'No items match your filter' : 'No items yet'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filter ? 'Try a different search term.' : 'Items will appear here once created.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
              onChange={toggleAllItems}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Select All
            </span>
          </div>

          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 flex items-center gap-4"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleItemSelection(item.id)}
                className="w-4 h-4"
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/projects/${projectId}/items/${item.id}`}
                  className="block hover:bg-zinc-50 dark:hover:bg-zinc-700 -m-2 p-2 rounded transition-colors"
                >
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {item.title || 'Untitled Item'}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Room: {item.room.name}</span>
                    <span>•</span>
                    <span>
                      Container: {item.container ? item.container.code : '—'}
                    </span>
                    <span>•</span>
                    <span>
                      {item.kind} ({item.count})
                    </span>
                  </div>
                  {item.notes && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </Link>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ type: 'single', itemId: item.id });
                  setShowDeleteModal(true);
                }}
                className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete item"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {deleteTarget?.type === 'bulk'
                ? `Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone. All associated images will also be deleted.`
                : 'Are you sure you want to delete this item? This action cannot be undone. All associated images will also be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteTarget?.type === 'bulk') {
                    handleBulkDelete();
                  } else {
                    handleDeleteItem(deleteTarget.itemId);
                  }
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
