import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { RoomCard, CreateRoomModal } from '@/components/lobby';
import { useGameStore } from '@/store/gameStore';
import './GameLobbyPage.css';

export const GameLobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Get state and actions from game store
  const { rooms, isLoading, error, fetchRooms, createRoom, joinRoom, clearError } = useGameStore();

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = () => {
    clearError();
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRoomSubmit = async (data: { name: string; maxPlayers: number }) => {
    await createRoom(data);
    if (!useGameStore.getState().error) {
      setIsCreateModalOpen(false);
      // Refresh rooms list after creating
      await fetchRooms();
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    clearError();
    await joinRoom(roomId);
    // If join is successful, navigate to the room (game page)
    // For now, just refresh the rooms list
    if (!useGameStore.getState().error) {
      await fetchRooms();
    }
  };

  const handleRefresh = async () => {
    clearError();
    await fetchRooms();
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="game-lobby-page">
      <div className="lobby-container">
        {/* Header Section */}
        <header className="lobby-header">
          <div className="header-content">
            <h1>Game Lobby</h1>
            <p className="subtitle">Find or create a game room to start playing</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleBackToDashboard}
            className="back-button"
          >
            ← Back to Dashboard
          </Button>
        </header>

        {/* Actions Section */}
        <section className="lobby-actions">
          <div className="actions-left">
            <h2>Available Rooms</h2>
            <p className="room-count">{rooms.length} room{rooms.length !== 1 ? 's' : ''} available</p>
          </div>
          <div className="actions-right">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              className="refresh-button"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              className="create-button"
              disabled={isLoading}
            >
              ➕ Create Room
            </Button>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="error-close" onClick={clearError}>✕</button>
          </div>
        )}

        {/* Rooms Section */}
        <section className="rooms-section">
          {isLoading && rooms.length === 0 ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎮</div>
              <h3>No Game Rooms Available</h3>
              <p>Create a new room to start playing or wait for other players to create one.</p>
              <Button
                variant="primary"
                size="large"
                onClick={handleCreateRoom}
                className="empty-create-button"
              >
                Create Your First Room
              </Button>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateRoomSubmit}
      />
    </div>
  );
};
