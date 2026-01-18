/**
 * Purpose: Rooms management component with detail panel.
 * Exports: RoomsManagement component
 * Invariants:
 * - Displays all rooms in project with create form.
 * - Detail panel shows items or containers for selected room.
 * - Delete blocked if room has containers.
 * - Bulk delete with confirmation modal.
 * - Substring filter for items/containers in detail panel.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, deleteRoom, bulkDeleteRooms, getRoomDetails } from '@/lib/actions/rooms';

export default function RoomsManagement({ projectId, initialRooms }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [detailView, setDetailView] = useState('items'); // 'items' or 'containers'
  const [filter, setFilter] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single' | 'bulk', roomId?: string }
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

  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    setFilter('');
    setDetailView('items');

    // Fetch room details
    const result = await getRoomDetails(projectId, room.id);
    if (result.success) {
      setRoomDetails(result);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    setLoading(true);
    const result = await deleteRoom(projectId, roomId);

    if (result.success) {
      setRooms(rooms.filter((r) => r.id !== roomId));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setRoomDetails(null);
      }
      setDeleteTarget(null);
      setShowDeleteModal(false);
      router.refresh();
    } else {
      if (result.containerCount > 0) {
        setError(`Cannot delete room: contains ${result.containerCount} container(s). Delete or move containers first.`);
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRooms.length === 0) return;

    setLoading(true);
    const result = await bulkDeleteRooms(projectId, selectedRooms);

    if (result.success) {
      setRooms(rooms.filter((r) => !selectedRooms.includes(r.id)));
      if (selectedRoom && selectedRooms.includes(selectedRoom.id)) {
        setSelectedRoom(null);
        setRoomDetails(null);
      }
      setSelectedRooms([]);
      setDeleteTarget(null);
      setShowDeleteModal(false);

      if (result.failed && result.failed.length > 0) {
        const failedCount = result.failed.length;
        const withContainers = result.failed.filter(f => f.containerCount > 0).length;
        setError(`Deleted ${result.deleted} room(s). ${failedCount} room(s) could not be deleted (${withContainers} have containers).`);
      }

      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleRoomSelection = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const toggleAllRooms = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map((r) => r.id));
    }
  };

  // Filter items or containers based on search
  const filteredItems = useMemo(() => {
    if (!roomDetails?.items) return [];
    if (!filter) return roomDetails.items;

    const lowerFilter = filter.toLowerCase();
    return roomDetails.items.filter((item) =>
      (item.title && item.title.toLowerCase().includes(lowerFilter)) ||
      (item.notes && item.notes.toLowerCase().includes(lowerFilter)) ||
      (item.container?.code && item.container.code.toLowerCase().includes(lowerFilter))
    );
  }, [roomDetails?.items, filter]);

  const filteredContainers = useMemo(() => {
    if (!roomDetails?.containers) return [];
    if (!filter) return roomDetails.containers;

    const lowerFilter = filter.toLowerCase();
    return roomDetails.containers.filter((container) =>
      container.code.toLowerCase().includes(lowerFilter)
    );
  }, [roomDetails?.containers, filter]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column: Rooms List */}
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

        {/* Bulk Actions */}
        {selectedRooms.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              {selectedRooms.length} room(s) selected
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
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={selectedRooms.length === rooms.length}
                onChange={toggleAllRooms}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Select All
              </span>
            </div>
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`bg-white dark:bg-zinc-800 rounded-lg shadow p-4 flex items-center gap-4 ${
                  selectedRoom?.id === room.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room.id)}
                  onChange={() => toggleRoomSelection(room.id)}
                  className="w-4 h-4"
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSelectRoom(room)}
                >
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {room.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Slug: {room.slug}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteTarget({ type: 'single', roomId: room.id });
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
        {selectedRoom && roomDetails ? (
          <>
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {roomDetails.room.name}
              </h3>

              {/* Toggle View */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDetailView('items')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    detailView === 'items'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  Items ({roomDetails.items.length})
                </button>
                <button
                  onClick={() => setDetailView('containers')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    detailView === 'containers'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  Containers ({roomDetails.containers.length})
                </button>
              </div>

              {/* Filter Input */}
              <input
                type="text"
                placeholder={`Filter ${detailView}...`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-zinc-50"
              />

              {/* Items View */}
              {detailView === 'items' && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                      {filter ? 'No items match your filter.' : 'No items in this room yet.'}
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
                          {item.container ? `Container: ${item.container.code}` : 'No container'}
                          {' • '}
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
              )}

              {/* Containers View */}
              {detailView === 'containers' && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredContainers.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                      {filter ? 'No containers match your filter.' : 'No containers in this room yet.'}
                    </p>
                  ) : (
                    filteredContainers.map((container) => (
                      <div
                        key={container.id}
                        className="p-3 bg-zinc-50 dark:bg-zinc-700 rounded-md"
                      >
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-50">
                          {container.code}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          Seq: {container.seq}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              Select a room to view details
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
                ? `Are you sure you want to delete ${selectedRooms.length} room(s)? Rooms with containers cannot be deleted.`
                : 'Are you sure you want to delete this room? This action cannot be undone. Rooms with containers cannot be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteTarget?.type === 'bulk') {
                    handleBulkDelete();
                  } else {
                    handleDeleteRoom(deleteTarget.roomId);
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
