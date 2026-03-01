import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhaserGame } from '@/game/PhaserGame';
import { BootScene } from '@/game/scenes/BootScene';
import { MenuScene } from '@/game/scenes/MenuScene';
import { GameScene } from '@/game/scenes/GameScene';
import { GameHUD } from '@/components/GameHUD';
import { useGameStore } from '@/store/gameStore';
import './GamePage.css';

export const GamePage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { 
    joinRoomWithHub, 
    leaveRoomWithHub, 
    currentRoom,
    isLoading,
    error 
  } = useGameStore();

  useEffect(() => {
    if (!roomId) {
      navigate('/lobby');
      return;
    }

    // Join the room when component mounts
    joinRoomWithHub(roomId).catch((err) => {
      console.error('Failed to join room:', err);
      navigate('/lobby');
    });

    // Leave the room when component unmounts
    return () => {
      if (currentRoom) {
        leaveRoomWithHub(currentRoom.id).catch((err) => {
          console.error('Failed to leave room:', err);
        });
      }
    };
  }, [roomId]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="game-page loading" data-testid="game-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="game-page error" data-testid="game-page">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/lobby')}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Handle no room state
  if (!currentRoom) {
    return (
      <div className="game-page no-room" data-testid="game-page">
        <div className="no-room-message">
          <p>Room not found</p>
          <button onClick={() => navigate('/lobby')}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page" data-testid="game-page">
      <GameHUD />
      <div className="game-container">
        <PhaserGame 
          scenes={[BootScene, MenuScene, GameScene]}
          onReady={() => console.log('Game ready!')}
          onDestroy={() => console.log('Game destroyed')}
        />
      </div>
    </div>
  );
};
