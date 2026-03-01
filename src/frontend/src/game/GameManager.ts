import Phaser from 'phaser';
import { createPhaserConfig } from './config/gameConfig';
import type { GameState } from '@/store/gameStore';

export interface GameManagerEvents {
  onReady?: () => void;
  onDestroy?: () => void;
  onSceneChange?: (sceneName: string) => void;
}

export class GameManager {
  private game: Phaser.Game | null = null;
  private gameState: Pick<GameState, 'sendPosition' | 'players' | 'currentRoom'>;
  private events: GameManagerEvents;
  private positionUpdateInterval: number | null = null;

  constructor(
    gameState: Pick<GameState, 'sendPosition' | 'players' | 'currentRoom'>,
    events: GameManagerEvents = {}
  ) {
    this.gameState = gameState;
    this.events = events;
  }

  /**
   * Initialize the Phaser game instance
   */
  initialize(container: HTMLElement | string, scenes: Phaser.Types.Scenes.SceneType[] = []): void {
    if (this.game) {
      console.warn('Game already initialized');
      return;
    }

    const config = createPhaserConfig(container);
    config.scene = scenes;

    this.game = new Phaser.Game(config);

    if (this.events.onReady) {
      this.events.onReady();
    }
  }

  /**
   * Destroy the game instance and cleanup
   */
  destroy(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }

    if (this.game) {
      this.game.destroy(true);
      this.game = null;

      if (this.events.onDestroy) {
        this.events.onDestroy();
      }
    }
  }

  /**
   * Get the current active scene
   */
  getCurrentScene(): Phaser.Scene | null {
    if (!this.game) {
      return null;
    }

    const sceneManager = this.game.scene;
    const activeScenes = sceneManager.getScenes(true);
    
    return activeScenes.length > 0 ? activeScenes[0] : null;
  }

  /**
   * Get a specific scene by key
   */
  getScene(key: string): Phaser.Scene | null {
    if (!this.game) {
      return null;
    }

    return this.game.scene.getScene(key);
  }

  /**
   * Check if game is initialized
   */
  isInitialized(): boolean {
    return this.game !== null;
  }

  /**
   * Get the game instance
   */
  getGame(): Phaser.Game | null {
    return this.game;
  }

  /**
   * Get the game state
   */
  getGameState(): Pick<GameState, 'sendPosition' | 'players' | 'currentRoom'> {
    return this.gameState;
  }

  /**
   * Start a scene
   */
  startScene(sceneKey: string, data?: any): void {
    if (!this.game) {
      throw new Error('Game not initialized');
    }

    this.game.scene.start(sceneKey, data);

    if (this.events.onSceneChange) {
      this.events.onSceneChange(sceneKey);
    }
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this.game) {
      this.game.scene.pause();
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (this.game) {
      this.game.scene.resume();
    }
  }
}
