import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { RoomCard, CreateRoomModal } from '@/components/lobby';
import type { GameSession } from '@/types';
import './GameLobbyPage.css';

export const GameLobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Mock room data for demonstration
  const [rooms, setRooms] = useState<(GameSession & { name?: string })[]>([
    {
      id: '1',
      name: 'Epic Race Room',
      worldId: 'world-1',
      hostPlayerId: 'host-1',
      status: 'waiting',
      maxPlayers: 8,
      currentPlayers: 3,
      players: [
        {
          playerId: 'host-1',
          username: 'RacerPro',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 1,
        },
        {
          playerId: 'player-2',
          username: 'SpeedDemon',
          isReady: false,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 2,
        },
        {
          playerId: 'player-3',
          username: 'TurboKid',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 3,
        },
      ],
    },
    {
      id: '2',
      name: 'Beginners Welcome',
      worldId: 'world-2',
      hostPlayerId: 'host-2',
      status: 'waiting',
      maxPlayers: 4,
      currentPlayers: 2,
      players: [
        {
          playerId: 'host-2',
          username: 'NewbieHost',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 1,
        },
        {
          playerId: 'player-4',
          username: 'LearningToRace',
          isReady: false,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 2,
        },
      ],
    },
    {
      id: '3',
      name: 'Pro League',
      worldId: 'world-3',
      hostPlayerId: 'host-3',
      status: 'active',
      maxPlayers: 6,
      currentPlayers: 6,
      players: [
        {
          playerId: 'host-3',
          username: 'ProGamer',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 1,
        },
      ],
    },
  ]);

  const handleCreateRoom = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRoomSubmit = (data: { name: string; maxPlayers: number }) => {
    // In a real app, this would call the API
    console.log('Creating room:', data);
    
    // Mock: Add new room to the list
    const newRoom: GameSession & { name?: string } = {
      id: `${rooms.length + 1}`,
      name: data.name,
      worldId: 'world-1',
      hostPlayerId: 'current-user',
      status: 'waiting',
      maxPlayers: data.maxPlayers,
      currentPlayers: 1,
      players: [
        {
          playerId: 'current-user',
          username: 'You',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 1,
        },
      ],
    };
    
    setRooms([...rooms, newRoom]);
  };

  const handleJoinRoom = (roomId: string) => {
    // In a real app, this would call the API
    console.log('Joining room:', roomId);
  };

  const handleRefresh = () => {
    // In a real app, this would fetch rooms from the API
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
