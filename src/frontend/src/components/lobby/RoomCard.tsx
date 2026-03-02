import React from 'react';
import type { GameSession } from '@/types';
import { Button } from '@/components/common';
import './RoomCard.css';

interface RoomCardProps {
  room: GameSession & { name?: string };
  onJoin: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const isFull = room.currentPlayers >= room.maxPlayers;
  const isWaiting = room.status === 'waiting';
  const canJoin = isWaiting && !isFull;
  
  const hostPlayer = room.players.find(p => p.playerId === room.hostPlayerId);
  const roomName = room.name || `Room ${room.id.substring(0, 8)}`;

  const getStatusBadgeClass = () => {
    switch (room.status) {
      case 'waiting':
        return 'status-waiting';
      case 'starting':
        return 'status-starting';
      case 'active':
        return 'status-active';
      case 'finished':
        return 'status-finished';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    switch (room.status) {
      case 'waiting':
        return 'Waiting';
      case 'starting':
        return 'Starting';
      case 'active':
        return 'Active';
      case 'finished':
        return 'Finished';
      default:
        return room.status;
    }
  };

  const getButtonText = () => {
    if (isFull) return 'Full';
    if (room.status === 'starting') return 'Starting...';
    if (room.status === 'active') return 'In Progress';
    if (room.status === 'finished') return 'Finished';
    return 'Join Room';
  };

  const handleJoin = () => {
    if (canJoin) {
      onJoin(room.id);
    }
  };

  return (
    <div className="room-card" data-testid="room-card">
      <div className="room-card-header">
        <h3 className="room-name">{roomName}</h3>
        <span className={`status-badge ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="room-card-body">
        <div className="room-info">
          <div className="info-item">
            <span className="info-icon">👥</span>
            <span className="info-text">{room.currentPlayers}/{room.maxPlayers} Players</span>
          </div>
          
          {hostPlayer && (
            <div className="info-item">
              <span className="info-icon">👑</span>
              <span className="info-text">
                <span className="info-label">Host:</span> {hostPlayer.username}
              </span>
            </div>
          )}
        </div>

        <Button
          variant={canJoin ? 'primary' : 'secondary'}
          onClick={handleJoin}
          disabled={!canJoin}
          className="join-button"
          fullWidth
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};
