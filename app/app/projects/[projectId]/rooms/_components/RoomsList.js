/**
 * Purpose: Client component for listing and creating rooms.
 * Exports: RoomsList component
 * Invariants:
 * - Displays all rooms in project
 * - Inline form to create new rooms
 * - Slug is auto-generated server-side
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/lib/actions/rooms';

export default function RoomsList({ projectId, initialRooms }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createRoom(projectId, name);

    if (result.success) {
      setRooms([...rooms, result.room]);
      setName('');
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Room Form */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Create New Room
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Room name (e.g., Kitchen, Master Bedroom)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No rooms yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create your first room above to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {room.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Slug: {room.slug}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
