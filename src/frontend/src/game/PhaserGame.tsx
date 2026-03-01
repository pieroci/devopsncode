import { useEffect, useRef, useState } from 'react';
import { GameManager } from './GameManager';
import { useGameStore } from '@/store/gameStore';
import type { GameManagerEvents } from './GameManager';

export interface PhaserGameProps {
  scenes?: Phaser.Types.Scenes.SceneType[];
  onReady?: () => void;
  onDestroy?: () => void;
  className?: string;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  scenes = [],
  onReady,
  onDestroy,
  className = '',
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get necessary game store methods and state
  const { sendPosition, players, currentRoom } = useGameStore();

  useEffect(() => {
    if (!gameContainerRef.current) {
      return;
    }

    // Create game manager events
    const events: GameManagerEvents = {
      onReady: () => {
        setIsReady(true);
        onReady?.();
      },
      onDestroy: () => {
        setIsReady(false);
        onDestroy?.();
      },
    };

    // Create game manager
    const gameManager = new GameManager(
      { sendPosition, players, currentRoom },
      events
    );

    // Initialize game
    gameManager.initialize(gameContainerRef.current, scenes);
    gameManagerRef.current = gameManager;

    // Cleanup on unmount
    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
        gameManagerRef.current = null;
      }
    };
  }, []); // Empty dependency array - only initialize once

  return (
    <div 
      ref={gameContainerRef} 
      className={`phaser-game-container ${className}`}
      data-testid="phaser-game-container"
      data-ready={isReady}
    />
  );
};
