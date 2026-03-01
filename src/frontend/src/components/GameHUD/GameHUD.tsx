import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import './GameHUD.css';

export const GameHUD = () => {
  const navigate = useNavigate();
  const {
    players,
    currentRoom,
    isConnected,
    setLocalPlayerReady,
    leaveRoomWithHub,
  } = useGameStore();

  const [isReady, setIsReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleReadyToggle = async () => {
    try {
      const newReadyState = !isReady;
      await setLocalPlayerReady(newReadyState);
      setIsReady(newReadyState);
    } catch (error) {
      console.error('Failed to set ready state:', error);
    }
  };

  const handleLeaveGame = async () => {
    if (isLeaving) return;
    
    setIsLeaving(true);
    try {
      if (currentRoom) {
        await leaveRoomWithHub(currentRoom.id);
      }
      navigate('/lobby');
    } catch (error) {
      console.error('Failed to leave game:', error);
      setIsLeaving(false);
    }
  };

  return (
    <div className="game-hud" data-testid="game-hud">
      {/* Connection Status */}
      <div className="connection-status" data-testid="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Room Info */}
      {currentRoom && (
        <div className="room-info" data-testid="room-info">
          <h3>Room {currentRoom.id}</h3>
          <span className="player-count">
            {players.length}/{currentRoom.maxPlayers} Players
          </span>
        </div>
      )}

      {/* Player List */}
      <div className="player-list" data-testid="player-list">
        <h4>Players</h4>
        <ul>
          {players.map((player) => (
            <li key={player.playerId} className={player.isReady ? 'ready' : ''}>
              <span className="player-name">{player.username}</span>
              {player.isReady && <span className="ready-badge">✓ Ready</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons" data-testid="action-buttons">
        <button
          className={`ready-button ${isReady ? 'ready' : ''}`}
          onClick={handleReadyToggle}
          data-testid="ready-button"
          disabled={!isConnected}
        >
          {isReady ? '✓ Ready' : 'Ready Up'}
        </button>

        <button
          className="leave-button"
          onClick={handleLeaveGame}
          data-testid="leave-button"
          disabled={isLeaving}
        >
          {isLeaving ? 'Leaving...' : 'Leave Game'}
        </button>
      </div>
    </div>
  );
};
