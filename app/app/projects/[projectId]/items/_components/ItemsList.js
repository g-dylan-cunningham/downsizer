/**
 * Purpose: Client component for listing and creating items.
 * Exports: ItemsList component
 * Invariants:
 * - Displays all items in project
 * - Room selection required for creation
 * - Container selection optional
 * - Links to item detail page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createItem } from '@/lib/actions/items';

export default function ItemsList({ projectId, initialItems, rooms, containers }) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    roomId: '',
    containerId: '',
    title: '',
    kind: 'single',
    count: 1,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createItem({
      projectId,
      ...formData,
      count: parseInt(formData.count) || 1,
    });

    if (result.success) {
      setItems([result.item, ...items]);
      setFormData({
        roomId: '',
        containerId: '',
        title: '',
        kind: 'single',
        count: 1,
        notes: '',
      });
      setShowForm(false);
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (rooms.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          No rooms yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You need to create rooms before you can create items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Item Button/Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Create New Item
        </button>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
            Create New Item
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Room *
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  required
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Container (optional)
                </label>
                <select
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
                >
                  <option value="">None</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Kitchen dishes, Photo albums"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Kind
                </label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
                >
                  <option value="single">Single</option>
                  <option value="group">Group</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                placeholder="Additional details"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="px-6 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No items yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create your first item above to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/app/projects/${projectId}/items/${item.id}`}
              className="block bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {item.title || 'Untitled Item'}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Room: {item.room.name}</span>
                    {item.container && (
                      <span>• Container: {item.container.code}</span>
                    )}
                    <span>• {item.kind} ({item.count})</span>
                  </div>
                  {item.notes && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
