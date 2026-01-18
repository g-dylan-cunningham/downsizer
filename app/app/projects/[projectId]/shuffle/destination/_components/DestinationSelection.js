/**
 * Purpose: Destination container selection component for Shuffle Mode.
 * Exports: DestinationSelection component
 * Invariants:
 * - Allows manual container code entry or creating new container.
 * - Validates destination container exists and belongs to project.
 * - Redirects to confirmation page with source and destination data.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getContainerByQR, getContainerByCode } from '@/lib/actions/shuffle';
import { createContainer } from '@/lib/actions/containers';
import QRScanner from '../../_components/QRScanner';

export default function DestinationSelection({ projectId, project, rooms }) {
  const router = useRouter();
  const [mode, setMode] = useState('scan'); // 'scan', 'manual', or 'create'
  const [containerCode, setContainerCode] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceContainer, setSourceContainer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  // Load source container and selected items from sessionStorage
  useEffect(() => {
    const sourceData = sessionStorage.getItem('shuffle_sourceContainer');
    const itemsData = sessionStorage.getItem('shuffle_selectedItems');

    if (!sourceData || !itemsData) {
      // No data, redirect back to shuffle entry
      router.push(`/app/projects/${projectId}/shuffle`);
      return;
    }

    try {
      setSourceContainer(JSON.parse(sourceData));
      setSelectedItems(JSON.parse(itemsData));
    } catch (err) {
      console.error('Failed to parse session data:', err);
      router.push(`/app/projects/${projectId}/shuffle`);
    }

    // Set default room to first room
    if (rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [projectId, router, rooms]);

  // Handle QR code scan
  const handleQRScan = async (qrPayload) => {
    if (!sourceContainer) {
      setError('Source container data missing');
      return;
    }

    setLoading(true);
    setError('');

    const result = await getContainerByQR(projectId, qrPayload);

    if (result.success) {
      // Check if destination is same as source
      if (result.container.id === sourceContainer.id) {
        setError('Destination must be different from source');
        setLoading(false);
        return;
      }

      // Store destination and navigate to confirm
      sessionStorage.setItem('shuffle_destinationContainer', JSON.stringify(result.container));
      router.push(`/app/projects/${projectId}/shuffle/confirm`);
    } else {
      setError(result.error || 'Container not found');
      setLoading(false);
    }
  };

  // Handle QR scan error
  const handleQRError = (errorMessage) => {
    setError(errorMessage);
  };

  // Handle manual entry submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!containerCode.trim()) {
      setError('Please enter a container code');
      return;
    }

    if (!sourceContainer) {
      setError('Source container data missing');
      return;
    }

    setLoading(true);
    setError('');

    const result = await getContainerByCode(projectId, containerCode.trim());

    if (result.success) {
      // Check if destination is same as source
      if (result.container.id === sourceContainer.id) {
        setError('Destination must be different from source');
        setLoading(false);
        return;
      }

      // Store destination and navigate to confirm
      sessionStorage.setItem('shuffle_destinationContainer', JSON.stringify(result.container));
      router.push(`/app/projects/${projectId}/shuffle/confirm`);
    } else {
      setError(result.error || 'Container not found');
      setLoading(false);
    }
  };

  const handleCreateContainer = async () => {
    if (!selectedRoomId) {
      setError('Please select a room');
      return;
    }

    if (!sourceContainer) {
      setError('Source container data missing');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createContainer(projectId, selectedRoomId);

    if (result.success) {
      // Store new destination and navigate to confirm
      sessionStorage.setItem('shuffle_destinationContainer', JSON.stringify(result.container));
      router.push(`/app/projects/${projectId}/shuffle/confirm`);
    } else {
      setError(result.error || 'Failed to create container');
      setLoading(false);
    }
  };

  if (!sourceContainer) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Destination</p>
              <h1 className="text-xl font-semibold">Select Destination Container</h1>
            </div>
            <Link
              href={`/app/projects/${projectId}`}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
          <p className="text-sm opacity-90">
            Moving {selectedItems.length} items from {sourceContainer.code}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Mode selector */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-2 flex gap-2">
          <button
            onClick={() => setMode('scan')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              mode === 'scan'
                ? 'bg-green-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            Scan QR
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              mode === 'manual'
                ? 'bg-green-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            Enter Code
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              mode === 'create'
                ? 'bg-green-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            Create New
          </button>
        </div>

        {/* QR Scan mode */}
        {mode === 'scan' && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Scan Destination Container QR
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Point your camera at the destination container's QR code
            </p>

            <QRScanner
              onScan={handleQRScan}
              onError={handleQRError}
              label="Scan Destination Container"
              color="green"
            />

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual entry mode */}
        {mode === 'manual' && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Enter Destination Container Code
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Container Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., PANTRY-BOX-0003"
                  value={containerCode}
                  onChange={(e) => setContainerCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50 font-mono text-lg"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !containerCode.trim()}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validating...' : 'Continue to Confirmation'}
              </button>
            </form>
          </div>
        )}

        {/* Create new container mode */}
        {mode === 'create' && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Create New Destination Container
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Select Room for New Container
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  disabled={loading || rooms.length === 0}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  A new container code will be automatically generated for this room
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateContainer}
                disabled={loading || !selectedRoomId}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Container & Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
