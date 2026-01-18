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

  const supportSections = [
    {
      name: 'Rooms',
      href: `/projects/${projectId}/rooms`,
      description: 'Manage rooms within this project',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      name: 'Containers',
      href: `/projects/${projectId}/containers`,
      description: 'Manage boxes and containers',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
    },
    {
      name: 'Items',
      href: `/projects/${projectId}/items`,
      description: 'View and manage all items',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
  ];

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

        {/* Supporting sections */}
        <div>
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            Project Management
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {supportSections.map((section) => (
              <Link
                key={section.name}
                href={section.href}
                className="block bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {section.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                      {section.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
