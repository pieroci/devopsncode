import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import './GameLobbyPage.css';

export const GameLobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms] = useState<any[]>([]); // Will be populated with real data later

  const handleCreateRoom = () => {
    // TODO: Open create room modal
    console.log('Create room clicked');
  };

  const handleRefresh = () => {
    // TODO: Refresh room list from API
    console.log('Refresh rooms clicked');
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
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              className="create-button"
            >
              ➕ Create Room
            </Button>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="rooms-section">
          {rooms.length === 0 ? (
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
              {/* Room cards will be rendered here */}
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <h3>{room.name}</h3>
                  <p>{room.players}/{room.maxPlayers} players</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
