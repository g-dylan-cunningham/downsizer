/**
 * Purpose: Client component for capture entry with room selection.
 * Exports: CaptureEntry component
 * Invariants:
 * - Room selection required to start capture.
 * - Last selected room persisted in localStorage: lastRoomId:{projectId}
 * - If saved room was deleted, fallback to first room + show notice.
 * - Persist room immediately on change (not just after capture).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CaptureEntry({ projectId, rooms }) {
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [showDeletedNotice, setShowDeletedNotice] = useState(false);
  const router = useRouter();

  // Load last selected room from localStorage on mount
  useEffect(() => {
    const storageKey = `lastRoomId:${projectId}`;
    const savedRoomId = localStorage.getItem(storageKey);

    if (savedRoomId) {
      // Check if saved room still exists
      const roomExists = rooms.some((r) => r.id === savedRoomId);

      if (roomExists) {
        setSelectedRoomId(savedRoomId);
      } else {
        // Saved room was deleted, fallback to first room
        setSelectedRoomId(rooms[0].id);
        setShowDeletedNotice(true);
        // Save new room to localStorage
        localStorage.setItem(storageKey, rooms[0].id);
      }
    } else {
      // No saved room, default to first
      setSelectedRoomId(rooms[0].id);
      localStorage.setItem(storageKey, rooms[0].id);
    }
  }, [projectId, rooms]);

  // Persist room selection immediately on change
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    setShowDeletedNotice(false);
    const storageKey = `lastRoomId:${projectId}`;
    localStorage.setItem(storageKey, roomId);
  };

  const handleCaptureSingle = () => {
    router.push(`/projects/${projectId}/capture/single?roomId=${selectedRoomId}`);
  };

  const handleCaptureGroup = () => {
    router.push(`/projects/${projectId}/capture/group?roomId=${selectedRoomId}`);
  };

  if (!selectedRoomId) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Deleted room notice */}
      {showDeletedNotice && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Your previously selected room was deleted. Defaulted to first available room.
          </p>
        </div>
      )}

      {/* Room selection */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Select Room
        </h3>
        <select
          value={selectedRoomId}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          This room will be used for all captures until you change it.
        </p>
      </div>

      {/* Capture mode buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={handleCaptureSingle}
          className="flex flex-col items-center gap-3 bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
          </div>
          <div className="text-center">
            <h4 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Capture Single
            </h4>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              For unique items
            </p>
          </div>
        </button>

        <button
          onClick={handleCaptureGroup}
          className="flex flex-col items-center gap-3 bg-white dark:bg-zinc-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Capture Group
            </h4>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              For multiple similar items
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
