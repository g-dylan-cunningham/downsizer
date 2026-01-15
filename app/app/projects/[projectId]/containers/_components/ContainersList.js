/**
 * Purpose: Client component for listing and creating containers.
 * Exports: ContainersList component
 * Invariants:
 * - Displays all containers in project
 * - Room selection required for creation
 * - Code is auto-generated server-side
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createContainer } from '@/lib/actions/containers';

export default function ContainersList({ projectId, initialContainers, rooms }) {
  const [containers, setContainers] = useState(initialContainers);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await createContainer(projectId, roomId);

    if (result.success) {
      setContainers([result.container, ...containers]);
      setRoomId('');
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
          You need to create rooms before you can create containers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Container Form */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Create New Container
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            disabled={loading}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
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
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Container code will be auto-generated based on the room.
        </p>
      </div>

      {/* Containers List */}
      {containers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No containers yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create your first container above to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {containers.map((container) => (
            <div
              key={container.id}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-50">
                {container.code}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Room: {container.room.name}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Seq: {container.seq}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
