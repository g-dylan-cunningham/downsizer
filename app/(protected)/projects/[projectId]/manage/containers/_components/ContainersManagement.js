/**
 * Purpose: Containers management component with detail panel.
 * Exports: ContainersManagement component
 * Invariants:
 * - Displays all containers in project with create form.
 * - Detail panel shows items for selected container.
 * - Delete unpacks items (sets containerId to null).
 * - Bulk delete with confirmation modal.
 * - Substring filter for items in detail panel.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  createContainer,
  deleteContainer,
  bulkDeleteContainers,
  getContainerDetails,
} from '@/lib/actions/containers';

export default function ContainersManagement({ projectId, initialContainers, rooms }) {
  const [containers, setContainers] = useState(initialContainers);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [containerDetails, setContainerDetails] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single' | 'bulk', containerId?: string }
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

  const handleSelectContainer = async (container) => {
    setSelectedContainer(container);
    setFilter('');

    // Fetch container details
    const result = await getContainerDetails(projectId, container.id);
    if (result.success) {
      setContainerDetails(result);
    }
  };

  const handleDeleteContainer = async (containerId) => {
    setLoading(true);
    const result = await deleteContainer(projectId, containerId);

    if (result.success) {
      setContainers(containers.filter((c) => c.id !== containerId));
      if (selectedContainer?.id === containerId) {
        setSelectedContainer(null);
        setContainerDetails(null);
      }
      setDeleteTarget(null);
      setShowDeleteModal(false);
      setError('');

      if (result.itemsUnpacked > 0) {
        setError(`Container deleted. ${result.itemsUnpacked} item(s) were unpacked.`);
      }

      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedContainers.length === 0) return;

    setLoading(true);
    const result = await bulkDeleteContainers(projectId, selectedContainers);

    if (result.success) {
      setContainers(containers.filter((c) => !selectedContainers.includes(c.id)));
      if (selectedContainer && selectedContainers.includes(selectedContainer.id)) {
        setSelectedContainer(null);
        setContainerDetails(null);
      }
      setSelectedContainers([]);
      setDeleteTarget(null);
      setShowDeleteModal(false);
      setError('');

      if (result.itemsUnpacked > 0) {
        setError(`Deleted ${result.deleted} container(s). ${result.itemsUnpacked} item(s) were unpacked.`);
      }

      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleContainerSelection = (containerId) => {
    setSelectedContainers((prev) =>
      prev.includes(containerId)
        ? prev.filter((id) => id !== containerId)
        : [...prev, containerId]
    );
  };

  const toggleAllContainers = () => {
    if (selectedContainers.length === containers.length) {
      setSelectedContainers([]);
    } else {
      setSelectedContainers(containers.map((c) => c.id));
    }
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!containerDetails?.items) return [];
    if (!filter) return containerDetails.items;

    const lowerFilter = filter.toLowerCase();
    return containerDetails.items.filter((item) =>
      (item.title && item.title.toLowerCase().includes(lowerFilter)) ||
      (item.notes && item.notes.toLowerCase().includes(lowerFilter))
    );
  }, [containerDetails?.items, filter]);

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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column: Containers List */}
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
        </div>

        {/* Bulk Actions */}
        {selectedContainers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              {selectedContainers.length} container(s) selected
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
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={selectedContainers.length === containers.length}
                onChange={toggleAllContainers}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Select All
              </span>
            </div>
            {containers.map((container) => (
              <div
                key={container.id}
                className={`bg-white dark:bg-zinc-800 rounded-lg shadow p-4 flex items-center gap-4 ${
                  selectedContainer?.id === container.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedContainers.includes(container.id)}
                  onChange={() => toggleContainerSelection(container.id)}
                  className="w-4 h-4"
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSelectContainer(container)}
                >
                  <h3 className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-50">
                    {container.code}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Room: {container.room.name} • Seq: {container.seq}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteTarget({ type: 'single', containerId: container.id });
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Detail Panel */}
      <div className="space-y-6">
        {selectedContainer && containerDetails ? (
          <>
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h3 className="text-xl font-mono font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                {containerDetails.container.code}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Room: {containerDetails.container.room.name}
              </p>

              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Items ({containerDetails.items.length})
              </h4>

              {/* Filter Input */}
              <input
                type="text"
                placeholder="Filter items..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50"
              />

              {/* Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                    {filter ? 'No items match your filter.' : 'No items in this container yet.'}
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-700 rounded-md"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                        {item.title || 'Untitled Item'}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.kind} ({item.count})
                      </div>
                      {item.notes && (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              Select a container to view details
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {deleteTarget?.type === 'bulk'
                ? `Are you sure you want to delete ${selectedContainers.length} container(s)? All items in these containers will be unpacked (containerId set to null).`
                : 'Are you sure you want to delete this container? All items in this container will be unpacked (containerId set to null).'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteTarget?.type === 'bulk') {
                    handleBulkDelete();
                  } else {
                    handleDeleteContainer(deleteTarget.containerId);
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
