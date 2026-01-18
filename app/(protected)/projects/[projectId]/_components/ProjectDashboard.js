/**
 * Purpose: Project dashboard client component with mode-based navigation.
 * Exports: ProjectDashboard component
 * Invariants:
 * - Inventory Mode is the primary operational mode.
 * - Room selection required before entering Inventory Mode.
 * - Resume Inventory feature uses localStorage to restore last session.
 * - CRUD sections (Rooms, Containers, Items) are supporting tools.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectDashboard({ projectId, project, rooms }) {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [lastRoomId, setLastRoomId] = useState(null);
  const [lastContainerId, setLastContainerId] = useState(null);

  // Check for last inventory session on mount
  useEffect(() => {
    const roomStorageKey = `lastContainerId:${projectId}`;
    const savedData = Object.keys(localStorage)
      .filter((key) => key.startsWith(roomStorageKey))
      .map((key) => {
        const roomId = key.split(':')[2];
        const containerId = localStorage.getItem(key);
        return { roomId, containerId };
      });

    if (savedData.length > 0) {
      // Use the most recently used room (just pick first for now)
      const lastSession = savedData[0];
      // Verify the room still exists
      const roomStillExists = rooms.find((r) => r.id === lastSession.roomId);
      if (roomStillExists) {
        setLastRoomId(lastSession.roomId);
        setLastContainerId(lastSession.containerId);
      }
    }

    // Set default selected room to last used or first available
    if (rooms.length > 0) {
      if (lastRoomId) {
        setSelectedRoomId(lastRoomId);
      } else {
        setSelectedRoomId(rooms[0].id);
      }
    }
  }, [projectId, rooms, lastRoomId]);

  const handleEnterInventory = () => {
    if (!selectedRoomId) {
      return;
    }
    router.push(`/projects/${projectId}/inventory?roomId=${selectedRoomId}`);
  };

  const handleResumeInventory = () => {
    if (!lastRoomId) {
      return;
    }
    router.push(`/projects/${projectId}/inventory?roomId=${lastRoomId}`);
  };


  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Projects
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {project.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Resume Inventory - if available */}
        {lastRoomId && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                  Resume Inventory
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Continue where you left off in{' '}
                  {rooms.find((r) => r.id === lastRoomId)?.name || 'your last room'}
                </p>
              </div>
              <button
                onClick={handleResumeInventory}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}

        {/* Primary action - Enter Inventory Mode */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-semibold text-white">
                Inventory Mode
              </h3>
              <p className="mt-1 text-blue-100">
                Focused capture tool for on-site inventory
              </p>

              {rooms.length === 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-blue-100 mb-3">
                    Create rooms before entering Inventory Mode
                  </p>
                  <Link
                    href={`/projects/${projectId}/rooms`}
                    className="inline-block px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Create Rooms
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Select Room
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full px-4 py-2 bg-white/90 text-zinc-900 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleEnterInventory}
                    disabled={!selectedRoomId}
                    className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enter Inventory Mode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shuffle Mode - secondary action */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-white">
                Shuffle Mode
              </h3>
              <p className="mt-1 text-sm text-green-100">
                Move items between containers to correct packing mistakes
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href={`/projects/${projectId}/shuffle`}
                className="px-4 py-2 bg-white text-green-600 font-medium rounded-md hover:bg-green-50 transition-colors"
              >
                Enter
              </Link>
            </div>
          </div>
        </div>

        {/* Management Mode */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-white">
                Management Mode
              </h3>
              <p className="mt-1 text-sm text-purple-100">
                Comprehensive CRUD for rooms, containers, and items
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href={`/projects/${projectId}/manage/rooms`}
                className="px-4 py-2 bg-white text-purple-600 font-medium rounded-md hover:bg-purple-50 transition-colors"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
