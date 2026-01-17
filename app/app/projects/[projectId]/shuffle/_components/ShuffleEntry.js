/**
 * Purpose: Shuffle Mode entry component - manual container code entry.
 * Exports: ShuffleEntry component
 * Invariants:
 * - Validates container code exists and belongs to project.
 * - Redirects to source container view on success.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getContainerByCode } from '@/lib/actions/shuffle';

export default function ShuffleEntry({ projectId, project }) {
  const router = useRouter();
  const [containerCode, setContainerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!containerCode.trim()) {
      setError('Please enter a container code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await getContainerByCode(projectId, containerCode.trim());

    if (result.success) {
      // Navigate to source container view
      router.push(
        `/app/projects/${projectId}/shuffle/source/${result.container.id}`
      );
    } else {
      setError(result.error || 'Container not found');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Shuffle Mode</p>
              <h1 className="text-xl font-semibold">{project.name}</h1>
            </div>
            <Link
              href={`/app/projects/${projectId}`}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
            >
              Exit Shuffle
            </Link>
          </div>
          <p className="text-sm opacity-90">Move items between containers</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Select Source Container
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Enter the container code to see items and move them to another container.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Container Code
              </label>
              <input
                type="text"
                placeholder="e.g., KITCHEN-BOX-0001"
                value={containerCode}
                onChange={(e) => setContainerCode(e.target.value.toUpperCase())}
                disabled={loading}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-700 dark:text-zinc-50 disabled:opacity-50 font-mono text-lg"
                autoFocus
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Format: ROOM-BOX-#### (e.g., KITCHEN-BOX-0001)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !containerCode.trim()}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Loading...' : 'View Container Items'}
            </button>
          </form>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            How Shuffle Mode Works
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Enter the source container code</li>
            <li>Select items you want to move</li>
            <li>Enter or scan the destination container</li>
            <li>Confirm and complete the move</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
